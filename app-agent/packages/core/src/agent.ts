/**
 * Core Agent Implementation - ReAct Loop with App State Awareness
 */

import EventEmitter from 'eventemitter3';
import { z } from 'zod';
import { toolSchemas } from '@gakwaya/app-agent-entities';
import { EnhancedLLMClient } from '@gakwaya/app-agent-llm';
import { ToolRegistry, createBuiltinTools, agentToolToTool } from '@gakwaya/app-agent-tools';
import type { ToolContext } from '@gakwaya/app-agent-tools';
import { TaskPlanner } from '@gakwaya/app-agent-planner';
import { WorkflowEngine } from '@gakwaya/app-agent-workflow';
import { SemanticRegistry } from '@gakwaya/app-agent-semantic-registry';
import { StateManager } from '@gakwaya/app-agent-state-manager';
import { MemoryManager } from '@gakwaya/app-agent-memory';
import { MultiAgentCoordinator, createBuiltInAgents } from '@gakwaya/app-agent-multi-agent';
import { LearningSystem } from '@gakwaya/app-agent-learning';
import type {
  AgentConfig,
  AgentResult,
  AgentStatus,
  AgentObservation,
  AgentReasoning,
  HistoricalEvent,
  InternalState,
  AgentActionResult,
  AgentTool,
} from './types';
import { buildMessages, toolDescriptorsFromNames } from './prompt-builder';
import { buildDOMState, createBrowserDOMEnvironment } from './ports';
import type { FlatDOMTree } from './dom/types';

export class AppAgentCore extends EventEmitter {
  private config: AgentConfig;
  private llmClient: EnhancedLLMClient;
  private abortController: AbortController;
  private toolRegistry: ToolRegistry;
  private semanticRegistry: SemanticRegistry;
  private workflowEngine: WorkflowEngine;
  private planner: TaskPlanner;
  private domEnv = createBrowserDOMEnvironment();
  private stateManager?: StateManager;
  private memoryManager?: MemoryManager;
  private multiAgentCoordinator?: MultiAgentCoordinator;
  private learningSystem?: LearningSystem;
  private routingEnabled = true;
  private taskStartedAt = 0;
  private domCache: {
    tree: FlatDOMTree;
    timestamp: number;
    checksum: string;
  } | null = null;

  private _disposed = false;

  public task = '';
  public taskId = '';
  public history: HistoricalEvent[] = [];

  private _status: AgentStatus = 'idle';
  private _states: InternalState = {
    totalWaitTime: 0,
    lastURL: '',
    browserState: null,
  };

  constructor(config: AgentConfig) {
    super();

    this.config = config;
    this.llmClient = new EnhancedLLMClient({
      baseURL: config.baseURL,
      model: config.model,
      apiKey: config.apiKey,
      timeout: 30000,
      maxRetries: 3,
    });

    this.abortController = new AbortController();
    this.toolRegistry = new ToolRegistry({ enableCaching: config.enableToolCaching ?? true });
    this.semanticRegistry = new SemanticRegistry();
    this.workflowEngine = new WorkflowEngine();
    this.planner = new TaskPlanner();

    this.initializeTools();
    this.initializeEntities();
    this.initializeWorkflows();

    if (config.trackState) {
      this.stateManager = new StateManager({
        getAppState: config.getAppState,
        stateChangeThreshold: 1000,
        historyLimit: 100,
        onStateChange: (diff, newState, oldState) => {
          this.emit('statechange', { type: 'statechange', diff, newState, oldState });
        },
      });
      this.stateManager.startTracking(1000);
    }

    if (config.enableMemory) {
      this.memoryManager = new MemoryManager(config.memoryConfig);
      this.memoryManager.updateWorkingMemory({
        currentTask: '',
        currentGoal: '',
        recentObservations: [],
        recentActions: [],
        context: {},
        temporaryState: {},
      });
    }

    if (config.enableMultiAgent) {
      this.multiAgentCoordinator = new MultiAgentCoordinator();
      const delegate = {
        execute: async (specializedTask: string) => {
          this.routingEnabled = false;
          try {
            return await this.runTask(specializedTask);
          } finally {
            this.routingEnabled = true;
          }
        },
      };

      for (const agent of createBuiltInAgents(delegate)) {
        this.multiAgentCoordinator.registerAgent(agent);
      }

      if (config.customAgents) {
        for (const agent of Object.values(config.customAgents)) {
          this.multiAgentCoordinator.registerAgent(agent);
        }
      }
    }

    if (config.enableLearning) {
      this.learningSystem = new LearningSystem({
        enabled: true,
        ...config.learningConfig,
      });
    }
  }

  get status(): AgentStatus {
    return this._status;
  }

  private setStatus(status: AgentStatus): void {
    this._status = status;
    this.emit('statuschange', { type: 'statuschange', status });
  }

  async execute(task: string): Promise<AgentResult> {
    if (this._status === 'disposed') {
      return {
        success: false,
        result: 'Agent has been disposed',
        steps: 0,
        history: [],
        error: new Error('Agent has been disposed'),
      };
    }

    if (this.config.enableMultiAgent && this.multiAgentCoordinator && this.routingEnabled) {
      const route = this.multiAgentCoordinator.selectAgent(task);
      if (route) {
        const appState = await this.config.getAppState();
        return route.agent.execute(task, {
          appState,
          sharedContext: new Map(),
        });
      }
    }

    return this.runTask(task);
  }

  private async runTask(task: string): Promise<AgentResult> {
    if (this._status === 'disposed') {
      return {
        success: false,
        result: 'Agent has been disposed',
        steps: 0,
        history: [],
        error: new Error('Agent has been disposed'),
      };
    }

    // Fresh cancellation scope per task (dispose() aborts the in-flight controller only)
    this.abortController = new AbortController();

    this.taskStartedAt = Date.now();
    this.task = task;
    this.taskId = this.generateId();
    this.history = [];
    this._states = { totalWaitTime: 0, lastURL: '', browserState: null };
    this.domCache = null;

    if (this.memoryManager) {
      this.memoryManager.updateWorkingMemory({
        currentTask: task,
        currentGoal: `Complete task: ${task}`,
        recentObservations: [],
        recentActions: [],
        context: {},
        temporaryState: {},
      });
    }

    if (this.config.enablePlanning) {
      await this.planner.createPlan(
        task,
        {
          appState: {},
          availableTools: this.toolRegistry.getAllTools().map((t) => t.name),
          constraints: [],
          preferences: {
            speed: 'normal',
            riskTolerance: 'medium',
            verification: 'normal',
          },
        },
        async (prompt) => {
          const response = await this.llmClient.invokeReAct([{ role: 'user', content: prompt }]);
          return response.reasoning.memory;
        }
      );
    }

    this.setStatus('running');

    try {
      if (this.config.onBeforeTask) {
        await this.config.onBeforeTask(this);
      }

      const maxSteps = this.config.maxSteps ?? 40;

      for (let step = 1; step <= maxSteps; step++) {
        if (this.abortController.signal.aborted) {
          if (this._disposed) {
            throw new Error('Agent has been disposed');
          }
          throw new Error('Task aborted by user');
        }

        if (this.config.onBeforeStep) {
          await this.config.onBeforeStep(this, step);
        }

        const observation = await this.observe();
        this.addHistoryEvent({ type: 'observation', timestamp: Date.now(), data: observation });

        this.showActivity('Thinking...');
        const reasoning = await this.think(observation);
        this.addHistoryEvent({ type: 'reasoning', timestamp: Date.now(), data: reasoning });

        if (this.isDone(reasoning)) {
          this.setStatus('completed');
          if (this.memoryManager) {
            this.memoryManager.consolidateEpisode(this.task, 'success');
          }

          const result: AgentResult = {
            success: true,
            result: reasoning.memory,
            steps: step,
            history: this.history,
          };

          if (this.config.onAfterTask) {
            await this.config.onAfterTask(this, result);
          }

          if (this.learningSystem) {
            await this.learningSystem.recordPattern({
              task: this.task,
              steps: this.learningSystem.extractStepsFromHistory(this.history),
              result,
              durationMs: Date.now() - this.taskStartedAt,
            });
          }

          return result;
        }

        const actionResult = await this.act(reasoning);
        this.addHistoryEvent({ type: 'action', timestamp: Date.now(), data: actionResult });

        if (this.config.onAfterStep) {
          await this.config.onAfterStep(this, this.history);
        }

        if (this.config.stepDelay && this.config.stepDelay > 0) {
          await this.delay(this.config.stepDelay);
        }
      }

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
      const agentError = error instanceof Error ? error : new Error(String(error));
      console.error('[AppAgent] Task execution failed:', {
        task: this.task,
        error: agentError,
        steps: this.history.length,
      });

      return {
        success: false,
        result: this.getErrorMessage(error),
        steps: this.history.length,
        history: this.history,
        error: agentError,
      };
    }
  }

  private async observe(): Promise<AgentObservation> {
    this.showActivity('Observing...');

    const appState = await this.config.getAppState();

    if (this.stateManager) {
      await this.stateManager.checkStateChanges();
    }

    if (this.shouldRebuildDOM()) {
      const tree = this.domEnv.processor.getFlatTree();
      this.domCache = {
        tree,
        timestamp: Date.now(),
        checksum: `${this.domEnv.port.getChecksum()}-${tree.interactiveElements.size}`,
      };
    }

    const domTree = this.domCache!.tree;
    const domState = buildDOMState(this.domEnv, domTree);

    this._states.browserState = domState;
    this._states.lastURL = domState.url;

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

    if (this.memoryManager) {
      this.memoryManager.addObservation({
        timestamp: Date.now(),
        type: 'state',
        data: { appState, domState, observations },
        importance: 0.6,
      });
    }

    return {
      appState,
      domState,
      observations,
      stepNumber: this.history.length + 1,
      totalWaitTime: this._states.totalWaitTime,
    };
  }

  private async think(observation: AgentObservation): Promise<AgentReasoning> {
    let memoryContext = '';
    if (this.memoryManager) {
      const relevantContext = this.memoryManager.getRelevantContext(this.task, 3);
      if (relevantContext.length > 0) {
        memoryContext =
          '\n\nRelevant Memory Context:\n' +
          relevantContext
            .map((ctx) => `- ${ctx.content} (relevance: ${ctx.relevance.toFixed(2)})`)
            .join('\n');
      }
    }

    if (this.learningSystem) {
      const pattern = await this.learningSystem.findPattern(this.task);
      if (pattern) {
        memoryContext += `\n\n${this.learningSystem.getPatternHint(pattern)}`;
      }
    }

    const messages = buildMessages(
      this.task,
      observation,
      this.history,
      this.semanticRegistry.getContextSummary(),
      memoryContext,
      toolDescriptorsFromNames(this.toolRegistry.getAllTools())
    );

    const response = await this.llmClient.invokeReAct(messages);
    return response.reasoning;
  }

  private async act(reasoning: AgentReasoning): Promise<AgentActionResult> {
    const actionName = Object.keys(reasoning.action)[0];
    const actionParams = (reasoning.action as Record<string, unknown>)[actionName];

    this.showActivity(`Executing: ${actionName}`);

    if (!this.toolRegistry.getToolByName(actionName)) {
      return {
        success: false,
        result: `Unknown action: ${actionName}`,
        error: new Error(`Tool not found: ${actionName}`),
      };
    }

    try {
      const schema = toolSchemas[actionName as keyof typeof toolSchemas];
      if (!schema) {
        return {
          success: false,
          result: `No schema defined for action: ${actionName}`,
          error: new Error(`Schema not found for action: ${actionName}`),
        };
      }

      const validatedParams = schema.parse(actionParams);
      const appState = await this.config.getAppState();

      const context: ToolContext = {
        appState: appState as unknown as Record<string, unknown>,
        domState: this._states.browserState as unknown as Record<string, unknown>,
        agent: this,
        execution: {
          executionId: this.taskId,
          toolCallId: this.generateId(),
          timestamp: Date.now(),
        },
        signal: this.abortController.signal,
      };

      const result = await this.toolRegistry.executeByName(actionName, validatedParams, context);

      if (['click', 'input', 'select', 'scroll', 'navigate'].includes(actionName)) {
        this.domCache = null;
      }

      if (this.memoryManager) {
        this.memoryManager.addAction({
          timestamp: Date.now(),
          type: actionName,
          parameters: validatedParams,
          result,
          success: true,
        });
      }

      return { success: true, result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          result: `Invalid parameters for ${actionName}: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          error,
        };
      }

      return {
        success: false,
        result: `Action failed: ${this.getErrorMessage(error)}`,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private isDone(reasoning: AgentReasoning): boolean {
    const action = reasoning.action as Record<string, unknown>;
    return action['done'] === true || action['done'] === 'true';
  }

  private initializeTools(): void {
    const builtins = createBuiltinTools({
      getFlatTree: () => this.domEnv.processor.getFlatTree(),
      getElementByIndex: (index, tree) =>
        this.domEnv.processor.getElementByIndex(index, tree as FlatDOMTree),
      clickElement: (el) => this.domEnv.actions.clickElement(el as HTMLElement),
      inputText: (el, text) => this.domEnv.actions.inputText(el as HTMLElement, text),
      selectDropdown: (el, value) => this.domEnv.actions.selectDropdown(el as HTMLElement, value),
      scroll: (dir, amount) => this.domEnv.actions.scroll(dir, amount),
      delay: (ms) => this.delay(ms),
      navigate: (path) => {
        if (typeof window !== 'undefined') {
          window.location.assign(path);
        }
        return Promise.resolve({ result: `Navigated to ${path}` });
      },
      onWait: (duration) => {
        this._states.totalWaitTime += duration;
      },
    }) as import('@gakwaya/app-agent-tools').Tool[];

    for (const tool of builtins) {
      this.toolRegistry.registerTool(tool);
    }

    if (this.config.customTools) {
      for (const tool of Object.values(this.config.customTools)) {
        if (tool) {
          this.toolRegistry.registerTool(agentToolToTool(tool));
        }
      }
    }
  }

  private initializeEntities(): void {
    if (this.config.entitySchemas) {
      for (const schema of Object.values(this.config.entitySchemas)) {
        this.semanticRegistry.registerSchema(schema);
      }
    }
  }

  private initializeWorkflows(): void {
    if (!this.config.customWorkflows) return;

    for (const [id, def] of Object.entries(this.config.customWorkflows)) {
      if (def && typeof def === 'object' && 'name' in def) {
        const workflowDef = def as import('@gakwaya/app-agent-entities').WorkflowDefinition;
        const steps = Array.isArray(workflowDef.steps)
          ? workflowDef.steps.map((step, i) =>
              typeof step === 'string'
                ? {
                    id: `step-${i}`,
                    name: step,
                    type: 'action' as const,
                    action: { type: 'tool' as const, toolName: step, parameters: {} },
                  }
                : {
                    id: step.id,
                    name: step.name,
                    type: 'action' as const,
                    action: {
                      type: 'tool' as const,
                      toolName: step.toolName ?? step.action ?? step.name,
                      parameters: step.parameters ?? {},
                    },
                  }
            )
          : [];

        this.workflowEngine.registerWorkflow({
          id: workflowDef.id ?? id,
          name: workflowDef.name,
          description: workflowDef.description ?? '',
          version: '1.0.0',
          steps,
          variables: [],
          errorStrategy: 'stop',
          options: { enablePersistence: false },
          metadata: { tags: workflowDef.preconditions },
        });
      }
    }
  }

  private shouldRebuildDOM(): boolean {
    if (!this.domCache) return true;
    if (this._states.lastURL && this.domEnv.port.getLocationHref() !== this._states.lastURL) {
      return true;
    }
    if (this.domCache.timestamp < Date.now() - 5000) return true;
    const tree = this.domCache.tree;
    const expectedChecksum = `${this.domEnv.port.getChecksum()}-${tree.interactiveElements.size}`;
    return expectedChecksum !== this.domCache.checksum;
  }

  private addHistoryEvent(event: HistoricalEvent): void {
    this.history.push(event);
    this.emit('historychange', { type: 'historychange', history: this.history });
  }

  private showActivity(activity: string): void {
    this.emit('activity', { type: 'activity', activity });
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  dispose(): void {
    if (this._status === 'disposed') {
      return;
    }

    this._disposed = true;

    if (this.memoryManager) this.memoryManager.dispose();
    if (this.stateManager) this.stateManager.dispose();
    this.domCache = null;
    this.abortController.abort();
    this.setStatus('disposed');
    this.removeAllListeners();
    if (this.config.onDispose) this.config.onDispose(this);
  }

  registerTool(tool: AgentTool): void {
    this.toolRegistry.registerTool(agentToolToTool(tool));
  }

  unregisterTool(name: string): void {
    const tool = this.toolRegistry.getToolByName(name);
    if (tool) this.toolRegistry.unregisterTool(tool.id);
  }

  getTools(): Map<string, AgentTool> {
    const map = new Map<string, AgentTool>();
    for (const tool of this.toolRegistry.getAllTools()) {
      map.set(tool.name, {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: async (params, context) => {
          const toolContext: ToolContext = {
            appState: context.appState as unknown as Record<string, unknown>,
            domState: context.domState as unknown as Record<string, unknown>,
            agent: context.agent,
            execution: {
              executionId: this.taskId,
              toolCallId: this.generateId(),
              timestamp: Date.now(),
            },
            signal: context.signal,
          };
          return String(await tool.execute(params, toolContext));
        },
      });
    }
    return map;
  }

  getMemoryManager(): MemoryManager | undefined {
    return this.memoryManager;
  }

  getMemoryStats(): import('@gakwaya/app-agent-memory').MemoryStats | undefined {
    return this.memoryManager?.getStats();
  }

  getSemanticRegistry(): SemanticRegistry {
    return this.semanticRegistry;
  }

  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  addSemanticMemory(
    fact: string,
    confidence: number,
    source: import('@gakwaya/app-agent-memory').SemanticMemory['source']
  ): void {
    this.memoryManager?.addSemanticMemory(fact, confidence, source);
  }
}

export type * from './types';
