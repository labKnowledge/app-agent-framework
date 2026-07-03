/**
 * Core Agent Implementation - ReAct Loop with App State Awareness
 */

import EventEmitter from 'eventemitter3';
import type {
  AgentConfig,
  AgentResult,
  AgentStatus,
  AgentObservation,
  AgentReasoning,
  HistoricalEvent,
  ToolContext,
  InternalState,
  AgentEventPayload,
  AgentEventListener,
  AppState,
  DOMState,
} from './types';
import { LLMClient } from './llm/client';
import { DOMProcessor, DOMActions } from './dom';

/**
 * Core Agent Class
 *
 * Implements the ReAct (Reasoning + Acting) loop with:
 * - App state awareness
 * - Reflection-before-action mental model
 * - Event-driven state management
 * - Cooperative cancellation via AbortSignal
 */
export class AppAgentCore extends EventEmitter {
  private config: AgentConfig;
  private llmClient: LLMClient;
  private abortController: AbortController;
  private tools: Map<string, import('./types').Tool> = new Map();
  private domProcessor: DOMProcessor;
  private domActions: DOMActions;

  // Persistent state
  public task = '';
  public taskId = '';
  public history: HistoricalEvent[] = [];

  // Transient state
  private _status: AgentStatus = 'idle';
  private _states: InternalState = {
    totalWaitTime: 0,
    lastURL: '',
    browserState: null,
  };

  constructor(config: AgentConfig) {
    super();

    this.config = config;
    this.llmClient = new LLMClient({
      baseURL: config.baseURL,
      model: config.model,
      apiKey: config.apiKey,
      timeout: 30000,
      maxRetries: 3,
    });

    this.abortController = new AbortController();
    this.domProcessor = new DOMProcessor();
    this.domActions = new DOMActions();

    // Initialize built-in tools
    this.initializeTools();
  }

  /**
   * Get current agent status
   */
  get status(): AgentStatus {
    return this._status;
  }

  /**
   * Set agent status and emit event
   */
  private setStatus(status: AgentStatus): void {
    this._status = status;
    this.emit('statuschange', { type: 'statuschange', status });
  }

  /**
   * Execute a task
   */
  async execute(task: string): Promise<AgentResult> {
    this.task = task;
    this.taskId = this.generateId();
    this.history = [];
    this._states = {
      totalWaitTime: 0,
      lastURL: '',
      browserState: null,
    };

    this.setStatus('running');

    try {
      // Call before task hook
      if (this.config.onBeforeTask) {
        await this.config.onBeforeTask(this);
      }

      const maxSteps = this.config.maxSteps ?? 40;

      for (let step = 1; step <= maxSteps; step++) {
        // Check for cancellation
        if (this.abortController.signal.aborted) {
          throw new Error('Task aborted by user');
        }

        // Call before step hook
        if (this.config.onBeforeStep) {
          await this.config.onBeforeStep(this, step);
        }

        // OBSERVE phase
        const observation = await this.observe();
        this.addHistoryEvent({
          type: 'observation',
          timestamp: Date.now(),
          data: observation,
        });

        // THINK phase
        this.showActivity('Thinking...');
        const reasoning = await this.think(observation);
        this.addHistoryEvent({
          type: 'reasoning',
          timestamp: Date.now(),
          data: reasoning,
        });

        // Check if done
        if (this.isDone(reasoning)) {
          this.setStatus('completed');
          const result: AgentResult = {
            success: true,
            result: reasoning.memory,
            steps: step,
            history: this.history,
          };

          // Call after task hook
          if (this.config.onAfterTask) {
            await this.config.onAfterTask(this, result);
          }

          return result;
        }

        // ACT phase
        const actionResult = await this.act(reasoning);
        this.addHistoryEvent({
          type: 'action',
          timestamp: Date.now(),
          data: actionResult,
        });

        // Call after step hook
        if (this.config.onAfterStep) {
          await this.config.onAfterStep(this, this.history);
        }

        // Step delay
        if (this.config.stepDelay && this.config.stepDelay > 0) {
          await this.delay(this.config.stepDelay);
        }
      }

      // Max steps reached
      this.setStatus('error');
      return {
        success: false,
        result: 'Task did not complete within maximum steps',
        steps: maxSteps,
        history: this.history,
        error: new Error('Maximum steps reached'),
      };
    } catch (error) {
      this.setStatus('error');
      return {
        success: false,
        result: 'Task execution failed',
        steps: this.history.length,
        history: this.history,
        error: error as Error,
      };
    }
  }

  /**
   * OBSERVE phase: Gather current environment state
   */
  private async observe(): Promise<AgentObservation> {
    this.showActivity('Observing...');

    // Get app state
    const appState = await this.config.getAppState();

    // Get DOM state
    const domTree = this.domProcessor.getFlatTree();
    const scrollPos = this.domActions.getScrollPosition();

    const domState: DOMState = {
      url: window.location.href,
      title: document.title,
      content: this.domProcessor.dehydrateTree(domTree),
      header: `Page: ${document.title} | Scroll: ${scrollPos.atTop ? 'top' : scrollPos.atBottom ? 'bottom' : 'middle'}`,
      footer: `Interactive elements: ${domTree.interactiveElements.size} | ${scrollPos.atBottom ? 'At bottom' : 'Can scroll down'}`,
    };

    // Store in internal state
    this._states.browserState = domState;
    this._states.lastURL = domState.url;

    // Generate observations
    const observations: string[] = [];

    if (this._states.totalWaitTime > 5000) {
      observations.push(`Warning: Total wait time is ${this._states.totalWaitTime}ms`);
    }

    if (this.history.length >= 35) {
      observations.push('Approaching maximum step limit');
    }

    if (domTree.interactiveElements.size === 0) {
      observations.push('Warning: No interactive elements found on page');
    }

    return {
      appState,
      domState,
      observations,
      stepNumber: this.history.length + 1,
      totalWaitTime: this._states.totalWaitTime,
    };
  }

  /**
   * THINK phase: LLM reasoning with reflection-before-action
   */
  private async think(observation: AgentObservation): Promise<AgentReasoning> {
    this.showActivity('Reasoning...');

    const messages = this.buildMessages(observation);

    const response = await this.llmClient.invoke(messages, {
      // Tools will be added here
    });

    return response.reasoning;
  }

  /**
   * ACT phase: Execute the decided action
   */
  private async act(reasoning: AgentReasoning): Promise<import('./types').AgentActionResult> {
    const actionName = Object.keys(reasoning.action)[0];
    const actionParams = reasoning.action[actionName];

    this.showActivity(`Executing: ${actionName}`);

    const tool = this.tools.get(actionName);
    if (!tool) {
      return {
        success: false,
        result: `Unknown action: ${actionName}`,
        error: new Error(`Tool not found: ${actionName}`),
      };
    }

    try {
      const context: ToolContext = {
        appState: await this.config.getAppState(),
        agent: this,
        signal: this.abortController.signal,
      };

      const result = await tool.execute(actionParams, context);

      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        result: `Action failed: ${(error as Error).message}`,
        error: error as Error,
      };
    }
  }

  /**
   * Build messages for LLM
   */
  private buildMessages(observation: AgentObservation): import('./types').LLMMessage[] {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(observation);

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(): string {
    return `You are an intelligent application agent that can understand and navigate web applications.

You have access to:
- Application state (user data, context, preferences)
- DOM structure (UI elements and interactions)
- Semantic entities (domain concepts like Products, Orders)
- Workflows (multi-step processes)

Your goal is to help users complete tasks by understanding what they want and executing the right actions.

Think step by step:
1. Evaluate what happened in the previous step
2. Remember important information for future steps
3. Plan the next goal
4. Choose the right action to achieve it

Always respond with a JSON object containing:
- evaluation_previous_goal: What happened in the last step?
- memory: What should you remember?
- next_goal: What do you want to achieve next?
- action: { action_name: parameters }

Available actions will be provided in the user message.`;
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(observation: AgentObservation): string {
    const { appState, domState, observations, stepNumber, totalWaitTime } = observation;

    return `Task: ${this.task}

Step: ${stepNumber}
Total Wait Time: ${totalWaitTime}ms

Application State:
- Current View: ${appState.currentView}
- User: ${appState.user.id} (${appState.user.role})
- Authenticated: ${appState.user.isAuthenticated}

DOM State:
- URL: ${domState.url}
- Title: ${domState.title}

${observations.length > 0 ? `Observations:\n${observations.map(o => `- ${o}`).join('\n')}\n` : ''}
${this.history.length > 0 ? `History:\n${this.formatHistory()}\n` : ''}
`;
  }

  /**
   * Format history for prompt
   */
  private formatHistory(): string {
    return this.history
      .slice(-3) // Only last 3 events
      .map(event => {
        const type = event.type.toUpperCase();
        const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        return `[${type}] ${data}`;
      })
      .join('\n');
  }

  /**
   * Check if reasoning indicates task is done
   */
  private isDone(reasoning: AgentReasoning): boolean {
    return reasoning.action['done'] === true || reasoning.action['done'] === 'true';
  }

  /**
   * Initialize built-in tools
   */
  private initializeTools(): void {
    // done tool
    this.tools.set('done', {
      name: 'done',
      description: 'Mark the task as complete',
      inputSchema: {} as any,
      execute: async () => 'Task completed',
    });

    // wait tool
    this.tools.set('wait', {
      name: 'wait',
      description: 'Wait for a specified amount of time',
      inputSchema: {} as any,
      execute: async (params: any) => {
        const duration = params.duration || 1000;
        await this.delay(duration);
        this._states.totalWaitTime += duration;
        return `Waited ${duration}ms`;
      },
    });

    // click tool
    this.tools.set('click', {
      name: 'click',
      description: 'Click an interactive element by its index',
      inputSchema: {} as any,
      execute: async (params: any, context: ToolContext) => {
        const index = params.index;
        if (typeof index !== 'number') {
          throw new Error('Invalid index parameter');
        }

        const domTree = this.domProcessor.getFlatTree();
        const elementInfo = domTree.interactiveElements.get(index);
        if (!elementInfo) {
          throw new Error(`Element not found at index ${index}`);
        }

        const element = this.domProcessor.getElementByIndex(index, domTree);
        if (!element) {
          throw new Error(`Element not found in DOM: ${elementInfo.selector}`);
        }

        const result = await this.domActions.clickElement(element);
        return result.result;
      },
    });

    // input tool
    this.tools.set('input', {
      name: 'input',
      description: 'Enter text into an input field',
      inputSchema: {} as any,
      execute: async (params: any, context: ToolContext) => {
        const { index, text } = params;
        if (typeof index !== 'number' || typeof text !== 'string') {
          throw new Error('Invalid parameters');
        }

        const domTree = this.domProcessor.getFlatTree();
        const element = this.domProcessor.getElementByIndex(index, domTree);
        if (!element) {
          throw new Error(`Element not found at index ${index}`);
        }

        const result = await this.domActions.inputText(element, text);
        return result.result;
      },
    });

    // select tool
    this.tools.set('select', {
      name: 'select',
      description: 'Select an option from a dropdown',
      inputSchema: {} as any,
      execute: async (params: any, context: ToolContext) => {
        const { index, value } = params;
        if (typeof index !== 'number' || typeof value !== 'string') {
          throw new Error('Invalid parameters');
        }

        const domTree = this.domProcessor.getFlatTree();
        const element = this.domProcessor.getElementByIndex(index, domTree);
        if (!element) {
          throw new Error(`Element not found at index ${index}`);
        }

        const result = await this.domActions.selectDropdown(element, value);
        return result.result;
      },
    });

    // scroll tool
    this.tools.set('scroll', {
      name: 'scroll',
      description: 'Scroll the page in a direction',
      inputSchema: {} as any,
      execute: async (params: any, context: ToolContext) => {
        const { direction = 'down', amount = 100 } = params;
        const result = await this.domActions.scroll(direction, amount);
        return result.result;
      },
    });
  }

  /**
   * Add event to history
   */
  private addHistoryEvent(event: HistoricalEvent): void {
    this.history.push(event);
    this.emit('historychange', { type: 'historychange', history: this.history });
  }

  /**
   * Show transient activity
   */
  private showActivity(activity: string): void {
    this.emit('activity', { type: 'activity', activity });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose of agent resources
   */
  dispose(): void {
    this.abortController.abort();
    this.setStatus('disposed');
    this.removeAllListeners();

    if (this.config.onDispose) {
      this.config.onDispose(this);
    }
  }

  /**
   * Register a custom tool
   */
  registerTool(tool: import('./types').Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  /**
   * Get registered tools
   */
  getTools(): Map<string, import('./types').Tool> {
    return new Map(this.tools);
  }
}

// Export types
export type * from './types';
