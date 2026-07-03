/**
 * Workflow Engine
 *
 * Orchestrates complex multi-step workflows with state management,
 * parallel execution, and error recovery
 */

import EventEmitter from 'eventemitter3';
import { LocalStorageAdapter, type StoragePort } from '@gakwaya/entities';
import type {
  Workflow,
  WorkflowExecution,
  WorkflowStep,
  StepResult,
  FailedStep,
  Checkpoint,
  WorkflowEvent,
  WorkflowEngineConfig,
  StepAction,
  WorkflowTemplate,
} from './types';

/**
 * Workflow Engine Class
 */
export class WorkflowEngine extends EventEmitter {
  private config: Required<WorkflowEngineConfig> & { storage: StoragePort };
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private executionQueue: string[] = [];
  private isProcessing = false;
  private checkpointInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: WorkflowEngineConfig = {}) {
    super();

    this.config = {
      maxConcurrentWorkflows: config.maxConcurrentWorkflows ?? 5,
      defaultTimeout: config.defaultTimeout ?? 300000, // 5 minutes
      enablePersistence: config.enablePersistence ?? false,
      persistenceKey: config.persistenceKey ?? 'workflow-engine',
      checkpointInterval: config.checkpointInterval ?? 10000, // 10 seconds
      enableMetrics: config.enableMetrics ?? true,
      storage: config.storage ?? new LocalStorageAdapter(),
    };

    // Load from persistence if enabled
    if (this.config.enablePersistence) {
      this.loadFromPersistence();
    }

    // Start checkpoint interval
    this.startCheckpointInterval();
  }

  /**
   * Register workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);

    if (this.config.enablePersistence) {
      this.saveToPersistence();
    }
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  /**
   * Create workflow from template
   */
  createFromTemplate(template: WorkflowTemplate, parameters: Record<string, unknown>): Workflow {
    const workflow: Workflow = {
      id: this.generateId(),
      ...template.workflow,
      metadata: {
        author: template.templateId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [template.category],
        category: template.category,
      },
    };

    // Apply template parameters
    for (const param of template.parameters) {
      if (param.name in parameters) {
        workflow.variables.push({
          name: param.name,
          type: param.type,
          defaultValue: parameters[param.name],
          required: param.required,
          description: param.description,
        });
      } else if (param.required) {
        throw new Error(`Required parameter missing: ${param.name}`);
      }
    }

    this.registerWorkflow(workflow);
    return workflow;
  }

  /**
   * Start workflow execution
   */
  async startExecution(
    workflowId: string,
    inputVariables?: Record<string, unknown>
  ): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = this.generateId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      currentStepIndex: 0,
      completedSteps: [],
      failedSteps: [],
      stepResults: new Map(),
      variables: this.initializeVariables(workflow, inputVariables),
      startedAt: Date.now(),
      checkpoints: [],
    };

    this.executions.set(executionId, execution);
    this.executionQueue.push(executionId);

    this.emitEvent({
      eventType: 'started',
      executionId,
      timestamp: Date.now(),
      data: { workflowId },
    });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }

    return executionId;
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Pause execution
   */
  pauseExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';

      this.emitEvent({
        eventType: 'paused',
        executionId,
        timestamp: Date.now(),
      });

      if (this.config.enablePersistence) {
        this.saveToPersistence();
      }
    }
  }

  /**
   * Resume execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';

      this.emitEvent({
        eventType: 'resumed',
        executionId,
        timestamp: Date.now(),
      });

      this.executionQueue.push(executionId);
      this.processQueue();
    }
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'cancelled';
      execution.endedAt = Date.now();

      this.emitEvent({
        eventType: 'failed',
        executionId,
        timestamp: Date.now(),
        data: { reason: 'cancelled' },
      });

      if (this.config.enablePersistence) {
        this.saveToPersistence();
      }
    }
  }

  /**
   * Get execution history
   */
  getExecutionHistory(executionId: string): StepResult[] {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return [];
    }

    return Array.from(execution.stepResults.values());
  }

  /**
   * Dispose of engine
   */
  dispose(): void {
    // Stop checkpoint interval
    if (this.checkpointInterval) {
      clearInterval(this.checkpointInterval);
      this.checkpointInterval = null;
    }

    // Save to persistence before disposing
    if (this.config.enablePersistence) {
      this.saveToPersistence();
    }

    // Clear all data
    this.workflows.clear();
    this.executions.clear();
    this.executionQueue = [];
    this.removeAllListeners();
  }

  /**
   * Private methods
   */

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.executionQueue.length > 0) {
        const executionId = this.executionQueue.shift();
        if (!executionId) continue;

        const execution = this.executions.get(executionId);
        if (!execution || execution.status === 'cancelled') {
          continue;
        }

        await this.executeWorkflow(execution);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeWorkflow(execution: WorkflowExecution): Promise<void> {
    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${execution.workflowId}`);
    }

    execution.status = 'running';

    try {
      // Execute steps
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];

        // Check if execution was cancelled/paused
        if (execution.status !== 'running') {
          break;
        }

        // Check dependencies
        if (!this.areDependenciesMet(step, execution)) {
          continue;
        }

        // Check parallel execution limit
        if (step.allowParallel && this.canExecuteParallel()) {
          // Execute in parallel
          this.executeStepAsync(execution, step, i);
        } else {
          // Execute sequentially
          await this.executeStep(execution, step, i);
        }

        execution.currentStepIndex = i;

        // Handle errors
        if (execution.failedSteps.length > 0) {
          const lastFailed = execution.failedSteps[execution.failedSteps.length - 1];

          if (step.onError) {
            await this.handleStepError(execution, step, lastFailed);
          } else if (workflow.errorStrategy === 'stop') {
            execution.status = 'failed';
            execution.error = {
              message: lastFailed.error.message,
              stepId: lastFailed.stepId,
            };
            break;
          }
        }

        // Create checkpoint if enabled
        if (workflow.options.enableCheckpoints) {
          await this.createCheckpoint(execution, i);
        }
      }

      // Check if workflow completed successfully
      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.endedAt = Date.now();

        this.emitEvent({
          eventType: 'completed',
          executionId: execution.id,
          timestamp: Date.now(),
          data: {
            duration: execution.endedAt - execution.startedAt,
            stepsCompleted: execution.completedSteps.length,
          },
        });
      }
    } catch (error) {
      execution.status = 'failed';
      execution.error = {
        message: error instanceof Error ? error.message : String(error),
      };
      execution.endedAt = Date.now();

      this.emitEvent({
        eventType: 'failed',
        executionId: execution.id,
        timestamp: Date.now(),
        data: { error: execution.error },
      });
    } finally {
      if (this.config.enablePersistence) {
        this.saveToPersistence();
      }
    }
  }

  private async executeStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    _stepIndex: number
  ): Promise<void> {
    const startTime = Date.now();

    this.emitEvent({
      eventType: 'step_started',
      executionId: execution.id,
      timestamp: startTime,
      data: { stepId: step.id, stepName: step.name },
    });

    try {
      // Execute step action
      const result = await this.executeAction(step.action, execution);

      // Store result
      const stepResult: StepResult = {
        stepId: step.id,
        success: true,
        result,
        duration: Date.now() - startTime,
        timestamp: startTime,
      };

      execution.stepResults.set(step.id, stepResult);
      execution.completedSteps.push(step.id);

      // Apply output mapping
      if (step.outputMapping) {
        this.applyOutputMapping(result, step.outputMapping, execution.variables);
      }

      this.emitEvent({
        eventType: 'step_completed',
        executionId: execution.id,
        timestamp: Date.now(),
        data: { stepId: step.id, result },
      });
    } catch (error) {
      const stepError = error instanceof Error ? error : new Error(String(error));

      execution.failedSteps.push({
        stepId: step.id,
        error: stepError,
        timestamp: Date.now(),
        retryCount: 0,
      });

      this.emitEvent({
        eventType: 'step_failed',
        executionId: execution.id,
        timestamp: Date.now(),
        data: { stepId: step.id, error: stepError },
      });

      throw stepError;
    }
  }

  private async executeStepAsync(
    execution: WorkflowExecution,
    step: WorkflowStep,
    _stepIndex: number
  ): Promise<void> {
    // Execute in background without awaiting
    this.executeStep(execution, step, _stepIndex).catch((error) => {
      console.error(`Async step execution failed: ${step.id}`, error);
    });
  }

  private async executeAction(action: StepAction, execution: WorkflowExecution): Promise<unknown> {
    switch (action.type) {
      case 'tool':
        return await this.executeToolAction(action, execution);

      case 'conditional':
        return await this.executeConditionalAction(action, execution);

      case 'loop':
        return await this.executeLoopAction(action, execution);

      case 'wait':
        return await this.executeWaitAction(action, execution);

      case 'trigger':
        return await this.executeTriggerAction(action, execution);

      default:
        throw new Error(`Unsupported action type: ${(action as StepAction).type}`);
    }
  }

  private async executeToolAction(action: any, execution: WorkflowExecution): Promise<unknown> {
    // Map input variables
    const parameters = this.mapInputVariables(action.parameters, execution.variables);

    // Emit tool execution event (can be intercepted by agent)
    this.emit('tool_execution', {
      toolName: action.toolName,
      parameters,
      executionId: execution.id,
    });

    // Return placeholder - actual execution handled by agent
    return { executed: true, toolName: action.toolName };
  }

  private async executeConditionalAction(
    action: any,
    execution: WorkflowExecution
  ): Promise<unknown> {
    for (const branch of action.branches) {
      if (this.evaluateCondition(branch.condition, execution.variables)) {
        return await this.executeAction(branch.action, execution);
      }
    }

    // Execute default if no branch matched
    if (action.default) {
      return await this.executeAction(action.default, execution);
    }

    return null;
  }

  private async executeLoopAction(action: any, execution: WorkflowExecution): Promise<unknown> {
    const iterations =
      typeof action.iterations === 'number'
        ? action.iterations
        : action.iterations === 'until' && action.condition
          ? -1 // Infinite until condition
          : 1;

    const results: unknown[] = [];

    for (let i = 0; i < iterations || iterations === -1; i++) {
      // Update loop variable
      if (action.loopVariable) {
        execution.variables[action.loopVariable] = i;
      }

      // Check exit condition
      if (action.condition && !this.evaluateCondition(action.condition, execution.variables)) {
        break;
      }

      const result = await this.executeAction(action.body, execution);
      results.push(result);
    }

    return results;
  }

  private async executeWaitAction(action: any, execution: WorkflowExecution): Promise<unknown> {
    if (action.duration) {
      await this.delay(action.duration);
    } else if (action.condition) {
      // Wait until condition is met
      while (!this.evaluateCondition(action.condition, execution.variables)) {
        await this.delay(action.pollInterval || 1000);
      }
    }

    return { waited: true };
  }

  private async executeTriggerAction(action: any, execution: WorkflowExecution): Promise<unknown> {
    this.emit(action.eventType, {
      payload: action.payload,
      executionId: execution.id,
      variables: execution.variables,
    });

    return { triggered: true };
  }

  private areDependenciesMet(step: WorkflowStep, execution: WorkflowExecution): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every((depId) => execution.completedSteps.includes(depId));
  }

  private canExecuteParallel(): boolean {
    const runningCount = Array.from(this.executions.values()).filter(
      (e) => e.status === 'running'
    ).length;

    return runningCount < this.config.maxConcurrentWorkflows;
  }

  private async handleStepError(
    execution: WorkflowExecution,
    step: WorkflowStep,
    failedStep: FailedStep
  ): Promise<void> {
    const errorHandling = step.onError;
    if (!errorHandling) {
      return;
    }

    switch (errorHandling.strategy) {
      case 'retry':
        if (errorHandling.maxRetries && failedStep.retryCount < errorHandling.maxRetries) {
          failedStep.retryCount++;
          await this.delay(errorHandling.retryDelay || 1000);
          await this.executeStep(execution, step, execution.currentStepIndex);
        }
        break;

      case 'continue':
        // Skip to next step
        break;

      case 'compensate':
        if (errorHandling.compensationSteps) {
          for (const _compStepId of errorHandling.compensationSteps) {
            void _compStepId;
            // Compensation step execution would be implemented here
          }
        }
        break;
    }
  }

  private initializeVariables(
    workflow: Workflow,
    inputVariables?: Record<string, unknown>
  ): Record<string, unknown> {
    const variables: Record<string, unknown> = {};

    for (const workflowVar of workflow.variables) {
      if (workflowVar.defaultValue !== undefined) {
        variables[workflowVar.name] = workflowVar.defaultValue;
      }
      if (inputVariables && workflowVar.name in inputVariables) {
        variables[workflowVar.name] = inputVariables[workflowVar.name];
      }
    }

    return variables;
  }

  private mapInputVariables(
    parameters: Record<string, unknown>,
    variables: Record<string, unknown>
  ): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        const varName = value.substring(1);
        mapped[key] = variables[varName];
      } else {
        mapped[key] = value;
      }
    }

    return mapped;
  }

  private applyOutputMapping(
    result: unknown,
    outputMapping: Record<string, string>,
    variables: Record<string, unknown>
  ): void {
    if (typeof result !== 'object' || result === null) {
      return;
    }

    const resultObj = result as Record<string, unknown>;

    for (const [sourceKey, targetVar] of Object.entries(outputMapping)) {
      if (sourceKey in resultObj) {
        variables[targetVar] = resultObj[sourceKey];
      }
    }
  }

  private evaluateCondition(condition: string, variables: Record<string, unknown>): boolean {
    // Simple condition evaluation - can be enhanced with proper expression parser
    try {
      // Replace variable references
      const expr = condition.replace(/\$(\w+)/g, (_, name) => {
        return JSON.stringify(variables[name] ?? null);
      });

      // Safe evaluation (in production, use proper expression parser)
      return new Function(`return ${expr}`)();
    } catch {
      return false;
    }
  }

  private async createCheckpoint(execution: WorkflowExecution, stepIndex: number): Promise<void> {
    const checkpoint: Checkpoint = {
      checkpointId: this.generateId(),
      timestamp: Date.now(),
      stepIndex,
      variables: { ...execution.variables },
      stepResults: new Map(execution.stepResults),
    };

    execution.checkpoints.push(checkpoint);

    this.emitEvent({
      eventType: 'checkpoint',
      executionId: execution.id,
      timestamp: checkpoint.timestamp,
      data: { checkpointId: checkpoint.checkpointId },
    });
  }

  private startCheckpointInterval(): void {
    if (!this.config.checkpointInterval || this.config.checkpointInterval <= 0) {
      return;
    }

    this.checkpointInterval = setInterval(() => {
      for (const execution of this.executions.values()) {
        if (execution.status === 'running') {
          this.createCheckpoint(execution, execution.currentStepIndex);
        }
      }
    }, this.config.checkpointInterval);
  }

  private emitEvent(event: WorkflowEvent): void {
    this.emit('workflow_event', event);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveToPersistence(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      const data = {
        workflows: Array.from(this.workflows.entries()),
        executions: Array.from(this.executions.entries()),
        timestamp: Date.now(),
      };
      await this.config.storage.set(this.config.persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save workflows to persistence:', error);
    }
  }

  private async loadFromPersistence(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      const data = await this.config.storage.get(this.config.persistenceKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.workflows = new Map(parsed.workflows);
        this.executions = new Map(
          parsed.executions.map(([id, exec]: [string, WorkflowExecution]) => [
            id,
            {
              ...exec,
              stepResults: new Map(Object.entries(exec.stepResults || {})),
            },
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load workflows from persistence:', error);
    }
  }
}
