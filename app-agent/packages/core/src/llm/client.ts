/**
 * LLM Client for communicating with language models
 */

import type { LLMClientConfig, LLMMessage, LLMResponse } from '../types';

/**
 * LLM Client for OpenAI-compatible APIs
 */
export class LLMClient {
  private config: LLMClientConfig;

  constructor(config: LLMClientConfig) {
    this.config = config;
  }

  /**
   * Invoke the LLM with messages
   */
  async invoke(messages: LLMMessage[], tools?: Record<string, unknown>): Promise<LLMResponse> {
    const maxRetries = this.config.maxRetries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.fetchLLM(messages, tools);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`LLM request failed (attempt ${attempt + 1}/${maxRetries}):`, error);

        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`LLM request failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Stream LLM responses (for future implementation)
   */
  async *stream(messages: LLMMessage[], tools?: Record<string, unknown>): AsyncGenerator<LLMResponse> {
    // TODO: Implement streaming
    throw new Error('Streaming not yet implemented');
  }

  /**
   * Fetch from LLM API
   */
  private async fetchLLM(messages: LLMMessage[], tools?: Record<string, unknown>): Promise<LLMResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const body = {
      model: this.config.model,
      messages,
      ...(tools && { tools }),
    };

    const timeout = this.config.timeout ?? 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      // Parse response based on OpenAI format
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid LLM response: missing content');
      }

      // Parse reasoning from content
      const reasoning = this.parseReasoning(content);

      return {
        reasoning,
        raw: data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`LLM request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Parse reasoning from LLM response
   */
  private parseReasoning(content: string): import('../types').AgentReasoning {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);

      // Validate structure
      if (
        typeof parsed.evaluation_previous_goal !== 'string' ||
        typeof parsed.memory !== 'string' ||
        typeof parsed.next_goal !== 'string' ||
        typeof parsed.action !== 'object'
      ) {
        throw new Error('Invalid reasoning structure');
      }

      return {
        evaluationPreviousGoal: parsed.evaluation_previous_goal,
        memory: parsed.memory,
        nextGoal: parsed.next_goal,
        action: parsed.action,
      };
    } catch (error) {
      // If parsing fails, return a basic structure
      console.warn('Failed to parse reasoning, using fallback structure:', error);
      return {
        evaluationPreviousGoal: 'Unable to parse evaluation',
        memory: content,
        nextGoal: 'Continue with task',
        action: {},
      };
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
