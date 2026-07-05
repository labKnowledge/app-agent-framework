/**
 * Enhanced LLM Client
 *
 * Advanced LLM integration with error classification and retry logic
 */

import EventEmitter from 'eventemitter3';
import { parseReasoningContent } from './parse-reasoning';
import { normalizeLLMResponse } from './response-normalizer';
import { withRetry, classifyLLMError, type RetryConfig } from './error-classification';
import type { CoreLLMResponse, LLMMessage as CoreLLMMessage } from '@gakwaya/app-agent-entities';
import type {
  LLMMessage,
  LLMResponse,
  LLMClientConfig,
  PromptOptimization,
} from './types';

export class EnhancedLLMClient extends EventEmitter {
  private config: Required<LLMClientConfig>;

  constructor(config: LLMClientConfig) {
    super();

    this.config = {
      baseURL: config.baseURL,
      model: config.model,
      apiKey: config.apiKey ?? '',
      timeout: config.timeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      organizationId: config.organizationId ?? '',
    };
  }

  /**
   * Invoke LLM for ReAct loop (returns reasoning + action)
   * Uses automatic retry for retryable errors
   * @param messages - Messages to send to LLM
   * @param signal - Optional abort signal for cancellation
   */
  async invokeReAct(messages: CoreLLMMessage[], signal?: AbortSignal): Promise<CoreLLMResponse> {
    const retryConfig: RetryConfig = {
      maxAttempts: this.config.maxRetries,
      baseDelay: this.config.retryDelay,
      onRetry: (attempt, error) => {
        console.debug(`[LLM] Retry attempt ${attempt}/${this.config.maxRetries} for error: ${error.type}`);
        this.emit('retry', { attempt, maxAttempts: this.config.maxRetries, error });
      },
    };

    return withRetry(async () => this.fetchReAct(messages, signal), retryConfig);
  }

  /**
   * Fetch ReAct response from LLM
   */
  private async fetchReAct(messages: CoreLLMMessage[], externalSignal?: AbortSignal): Promise<CoreLLMResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Combine external signal with timeout signal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    // Handle external abort signal
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        const onExternalAbort = () => controller.abort();
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        // Clean up listener when request completes
        setTimeout(() => {
          externalSignal.removeEventListener('abort', onExternalAbort);
        }, this.config.timeout + 100);
      }
    }

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: this.config.model, messages }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw classifyLLMError(
          new Error(`LLM API error: ${response.status} - ${errorText}`),
          { status: response.status, body: errorText }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw classifyLLMError(new Error('Invalid LLM response: missing content'));
      }

      return {
        reasoning: this.parseReasoning(content),
        raw: data,
      };
    } catch (error) {
      // Classify all errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw classifyLLMError(new Error(`LLM request timeout after ${this.config.timeout}ms`));
      }
      throw classifyLLMError(error);
    }
  }

  /**
   * Parse reasoning from LLM response
   */
  private parseReasoning(content: string): import('@gakwaya/app-agent-entities').AgentReasoning {
    try {
      // Try standard parsing first
      return parseReasoningContent(content);
    } catch (firstError) {
      // Fall back to response normalizer with auto-fixing
      console.debug('[LLM] Standard parsing failed, trying response normalizer:', firstError);

      const result = normalizeLLMResponse(content);
      if (!result.success || !result.reasoning) {
        const errorMessage = firstError instanceof Error ? firstError.message : String(firstError);
        throw new Error(`Failed to parse LLM response: ${result.error || errorMessage}`);
      }

      // Log any fixes applied
      if (result.fixes && result.fixes.length > 0) {
        console.debug('[LLM] Response normalizer applied fixes:', result.fixes.join(', '));
      }

      return result.reasoning;
    }
  }
}

// Re-export types for convenience
export type { LLMMessage, LLMResponse, LLMClientConfig, PromptOptimization };