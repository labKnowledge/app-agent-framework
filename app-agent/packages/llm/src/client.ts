/**
 * Enhanced LLM Client
 *
 * Advanced LLM integration with prompt optimization,
 * streaming support, and cost tracking
 */

import EventEmitter from 'eventemitter3';
import type {
  AgentReasoning,
  CoreLLMResponse,
  LLMMessage as CoreLLMMessage,
} from '@app-agent/entities';
import type {
  LLMMessage,
  LLMResponse,
  LLMClientConfig,
  PromptTemplate,
  PromptOptimization,
  StreamingCallback,
  CostTracking,
  ContextManagement,
} from './types';

/**
 * Enhanced LLM Client Class
 */
export class EnhancedLLMClient extends EventEmitter {
  private config: Required<LLMClientConfig>;
  private templates: Map<string, PromptTemplate> = new Map();
  private costTracking: CostTracking;
  private contextManagement: ContextManagement;
  private conversationHistory: LLMMessage[] = [];

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

    this.costTracking = {
      totalCost: 0,
      costByModel: {},
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      requestCount: 0,
    };

    this.contextManagement = {
      maxTokens: 128000,
      strategy: 'truncate',
      priorities: {
        system: 100,
        user: 90,
        tool: 80,
        assistant: 70,
      },
      summarizeThreshold: 0.8,
    };
  }

  /**
   * Invoke LLM for ReAct loop (returns reasoning + action)
   */
  async invokeReAct(messages: CoreLLMMessage[]): Promise<CoreLLMResponse> {
    const maxRetries = this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.fetchReAct(messages);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * this.config.retryDelay);
        }
      }
    }

    throw new Error(`LLM request failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Send completion request
   */
  async complete(messages: LLMMessage[], options?: PromptOptimization): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Optimize messages
      const optimizedMessages = this.optimizeMessages(messages, options);

      // Make API request
      const response = await this.makeRequest(optimizedMessages, options);

      // Calculate cost
      if (response.usage) {
        const cost = this.calculateCost(response.usage);
        response.cost = cost;
        this.updateCostTracking(response.usage, cost);
      }

      // Add timing
      response.timing = {
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
      };

      // Update conversation history
      this.addToHistory(response.message);

      return response;
    } catch (error) {
      throw new Error(`LLM request failed: ${error}`);
    }
  }

  /**
   * Stream completion request
   */
  async stream(
    messages: LLMMessage[],
    options?: PromptOptimization,
    onChunk?: StreamingCallback
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    let fullContent = '';

    try {
      // Optimize messages
      const optimizedMessages = this.optimizeMessages(messages, options);

      // Make streaming request
      const response = await this.makeStreamingRequest(optimizedMessages, options, (chunk) => {
        fullContent += chunk.content;
        if (onChunk) {
          onChunk({
            ...chunk,
            timing: {
              startTime,
              currentTime: Date.now(),
            },
          });
        }
      });

      // Set full content
      response.message.content = fullContent;

      // Calculate cost and timing
      if (response.usage) {
        const cost = this.calculateCost(response.usage);
        response.cost = cost;
        this.updateCostTracking(response.usage, cost);
      }

      response.timing = {
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
      };

      // Update conversation history
      this.addToHistory(response.message);

      return response;
    } catch (error) {
      throw new Error(`LLM streaming request failed: ${error}`);
    }
  }

  /**
   * Use prompt template
   */
  async useTemplate(
    templateId: string,
    variables: Record<string, unknown>,
    options?: PromptOptimization
  ): Promise<LLMResponse> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Build prompt from template
    const prompt = this.buildPromptFromTemplate(template, variables);

    const messages: LLMMessage[] = [{ role: 'user', content: prompt }];

    return this.complete(messages, options);
  }

  /**
   * Register prompt template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get cost tracking
   */
  getCosts(): CostTracking {
    return { ...this.costTracking };
  }

  /**
   * Clear context/conversation history
   */
  clearContext(): void {
    this.conversationHistory = [];
  }

  /**
   * Set context management
   */
  setContextManagement(config: ContextManagement): void {
    this.contextManagement = { ...this.contextManagement, ...config };
  }

  /**
   * Get conversation history
   */
  getHistory(): LLMMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Private methods
   */

  private optimizeMessages(messages: LLMMessage[], options?: PromptOptimization): LLMMessage[] {
    let optimized = [...messages];

    // Add conversation history
    if (this.conversationHistory.length > 0) {
      optimized = [...this.conversationHistory, ...optimized];
    }

    // Apply context management
    optimized = this.applyContextManagement(optimized);

    // Add system message if not present
    if (optimized.length === 0 || optimized[0].role !== 'system') {
      optimized.unshift({
        role: 'system',
        content: this.getSystemPrompt(options),
      });
    }

    // Apply prompt optimization
    if (options?.enableCompression) {
      optimized = this.compressMessages(optimized);
    }

    return optimized;
  }

  private applyContextManagement(messages: LLMMessage[]): LLMMessage[] {
    const totalTokens = this.estimateTokens(messages);

    if (totalTokens <= this.contextManagement.maxTokens) {
      return messages;
    }

    const ratio = this.contextManagement.maxTokens / totalTokens;

    switch (this.contextManagement.strategy) {
      case 'truncate':
        return this.truncateMessages(messages, ratio);

      case 'compress':
        return this.compressMessages(messages);

      case 'summarize':
        return this.summarizeMessages(messages, ratio);

      default:
        return this.truncateMessages(messages, ratio);
    }
  }

  private truncateMessages(messages: LLMMessage[], ratio: number): LLMMessage[] {
    // Keep system message, truncate others by priority
    const system = messages.find((m) => m.role === 'system');
    const others = messages.filter((m) => m.role !== 'system');

    const keepCount = Math.max(1, Math.floor(others.length * ratio));
    const kept = others.slice(-keepCount);

    return system ? [system, ...kept] : kept;
  }

  private compressMessages(messages: LLMMessage[]): LLMMessage[] {
    // Compress message content by removing redundancy
    return messages.map((msg) => ({
      ...msg,
      content: this.compressText(msg.content),
    }));
  }

  private summarizeMessages(messages: LLMMessage[], ratio: number): LLMMessage[] {
    // Summarize older messages, keep recent ones
    const splitPoint = Math.floor(messages.length * ratio);
    const older = messages.slice(0, splitPoint);
    const recent = messages.slice(splitPoint);

    const summary = this.createSummary(older);

    return [{ role: 'system', content: `[Previous conversation summary]\n${summary}` }, ...recent];
  }

  private getSystemPrompt(options?: PromptOptimization): string {
    let prompt = `You are an intelligent AI assistant that helps users complete tasks in web applications.

Your capabilities include:
- Understanding application state and context
- Executing actions through available tools
- Reasoning step-by-step to solve problems
- Learning from past interactions
- Adapting to changing circumstances

When responding:
1. Think step-by-step before acting
2. Use available tools when appropriate
3. Provide clear reasoning for your actions
4. Learn from mistakes and adapt
5. Ask for clarification when needed`;

    if (options?.temperature !== undefined) {
      prompt += `\n\nResponse temperature: ${options.temperature}`;
    }

    return prompt;
  }

  private buildPromptFromTemplate(
    template: PromptTemplate,
    variables: Record<string, unknown>
  ): string {
    let content = template.content;

    // Replace variables
    for (const variable of template.variables) {
      const value = variables[variable.name] ?? variable.defaultValue ?? '';
      const placeholder = `{{${variable.name}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Add examples if available
    if (template.examples && template.examples.length > 0) {
      content += '\n\nExamples:\n';
      for (const example of template.examples) {
        content += `\nInput: ${JSON.stringify(example.input)}\n`;
        content += `Output: ${example.output}\n`;
      }
    }

    return content;
  }

  private compressText(text: string): string {
    // Remove extra whitespace
    let compressed = text.replace(/\s+/g, ' ').trim();

    // Remove redundant phrases
    const redundant = ['I would like to', 'I want to', 'Can you please', 'Is it possible to'];

    for (const phrase of redundant) {
      compressed = compressed.replace(new RegExp(phrase, 'gi'), '');
    }

    return compressed;
  }

  private createSummary(messages: LLMMessage[]): string {
    // Create a simple summary of conversation
    const summary = messages.map((m) => `${m.role}: ${m.content.substring(0, 100)}...`).join('\n');

    return summary;
  }

  private estimateTokens(messages: LLMMessage[]): number {
    // Rough estimation: ~4 characters per token
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  private async fetchReAct(messages: CoreLLMMessage[]): Promise<CoreLLMResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: this.config.model, messages }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid LLM response: missing content');
      }

      return {
        reasoning: this.parseReasoning(content),
        raw: data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`LLM request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  private parseReasoning(content: string): AgentReasoning {
    try {
      const parsed = JSON.parse(content);
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
    } catch {
      return {
        evaluationPreviousGoal: 'Unable to parse evaluation',
        memory: content,
        nextGoal: 'Continue with task',
        action: { done: true },
      };
    }
  }

  private async makeRequest(
    messages: LLMMessage[],
    _options?: PromptOptimization
  ): Promise<LLMResponse> {
    // This would make actual API call
    // For now, return mock response
    return {
      message: {
        role: 'assistant',
        content: 'Mock response for testing',
      },
      model: this.config.model,
      finishReason: 'stop',
      usage: {
        promptTokens: this.estimateTokens(messages),
        completionTokens: 100,
        totalTokens: this.estimateTokens(messages) + 100,
      },
    };
  }

  private async makeStreamingRequest(
    messages: LLMMessage[],
    options?: PromptOptimization,
    onChunk?: (chunk: { content: string; done: boolean }) => void
  ): Promise<LLMResponse> {
    // This would make actual streaming API call
    // For now, simulate streaming
    const mockContent = 'Mock streaming response';

    for (let i = 0; i < mockContent.length; i++) {
      if (onChunk) {
        onChunk({
          content: mockContent[i],
          done: false,
        });
      }
      await this.delay(50); // Simulate streaming
    }

    if (onChunk) {
      onChunk({ content: '', done: true });
    }

    return {
      message: {
        role: 'assistant',
        content: '', // Will be set by stream method
      },
      model: this.config.model,
      finishReason: 'stop',
      usage: {
        promptTokens: this.estimateTokens(messages),
        completionTokens: mockContent.length,
        totalTokens: this.estimateTokens(messages) + mockContent.length,
      },
    };
  }

  private calculateCost(usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }): number {
    // Simplified cost calculation (would use actual pricing)
    const promptPrice = 0.000001; // $1 per 1M tokens
    const completionPrice = 0.000002; // $2 per 1M tokens

    return usage.promptTokens * promptPrice + usage.completionTokens * completionPrice;
  }

  private updateCostTracking(
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
    cost: number
  ): void {
    this.costTracking.totalCost += cost;
    this.costTracking.costByModel[this.config.model] =
      (this.costTracking.costByModel[this.config.model] || 0) + cost;
    this.costTracking.tokenUsage.promptTokens += usage.promptTokens;
    this.costTracking.tokenUsage.completionTokens += usage.completionTokens;
    this.costTracking.tokenUsage.totalTokens += usage.totalTokens;
    this.costTracking.requestCount += 1;
  }

  private addToHistory(message: LLMMessage): void {
    this.conversationHistory.push(message);

    // Keep history manageable
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
