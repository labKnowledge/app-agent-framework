/**
 * Task Planner
 *
 * Intelligent task planning and decomposition system
 */

import type {
  TaskPlan,
  PlannedTask,
  PlanningResult,
  PlannerConfig,
  ExecutionState,
  ReplanningTrigger,
  TaskType,
  PlanStatus,
} from './types';

/**
 * Task Planner Class
 */
export class TaskPlanner {
  private config: Required<PlannerConfig>;
  private currentPlan: TaskPlan | null = null;
  private executionState: ExecutionState;
  private replanningCount = 0;

  constructor(config: PlannerConfig = {}) {
    this.config = {
      maxDepth: config.maxDepth ?? 5,
      maxSubTasks: config.maxSubTasks ?? 10,
      planningTimeout: config.planningTimeout ?? 30000,
      enableReplanning: config.enableReplanning ?? true,
      maxReplanningAttempts: config.maxReplanningAttempts ?? 3,
      useFewShot: config.useFewShot ?? true,
      strategy: config.strategy ?? 'adaptive',
    };

    this.executionState = {
      currentTaskId: null,
      completedTasks: [],
      failedTasks: [],
      blockedTasks: [],
      progress: 0,
      phase: 'planning',
    };
  }

  /**
   * Create initial plan from user request
   */
  async createPlan(
    request: string,
    context: TaskPlan['context'],
    llmFn: (prompt: string) => Promise<string>,
  ): Promise<PlanningResult> {
    const startTime = Date.now();

    try {
      // Build planning prompt
      const prompt = this.buildPlanningPrompt(request, context);

      // Call LLM for planning
      const response = await llmFn(prompt);

      // Parse plan from response
      const plan = this.parsePlan(response, request, context);

      // Validate and optimize plan
      const optimizedPlan = this.optimizePlan(plan);

      // Calculate confidence
      const confidence = this.calculateConfidence(optimizedPlan, context);

      this.currentPlan = optimizedPlan;
      this.updateExecutionState('planning', null);

      return {
        plan: optimizedPlan,
        confidence,
        alternatives: [],
        reasoning: `Plan created for: ${request}`,
      };
    } catch (error) {
      throw new Error(`Planning failed: ${error}`);
    }
  }

  /**
   * Get next task to execute
   */
  getNextTask(): PlannedTask | null {
    if (!this.currentPlan) {
      return null;
    }

    const availableTasks = this.getAvailableTasks();
    if (availableTasks.length === 0) {
      return null;
    }

    // Sort by priority and dependencies
    availableTasks.sort((a, b) => {
      // First prioritize failed tasks that can be retried
      if (this.executionState.failedTasks.includes(a.id) &&
          !this.executionState.failedTasks.includes(b.id)) {
        return -1;
      }
      if (this.executionState.failedTasks.includes(b.id) &&
          !this.executionState.failedTasks.includes(a.id)) {
        return 1;
      }

      // Then by priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Finally by estimated duration (shorter first)
      return a.estimatedDuration - b.estimatedDuration;
    });

    return availableTasks[0];
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, result?: unknown): void {
    if (!this.currentPlan) {
      return;
    }

    const task = this.findTask(this.currentPlan.tasks, taskId);
    if (task) {
      task.status = 'completed';
      this.executionState.completedTasks.push(taskId);

      // Remove from failed tasks if it was there
      const failedIndex = this.executionState.failedTasks.indexOf(taskId);
      if (failedIndex !== -1) {
        this.executionState.failedTasks.splice(failedIndex, 1);
      }

      this.updateProgress();
      this.currentPlan.updatedAt = Date.now();
    }
  }

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: Error): void {
    if (!this.currentPlan) {
      return;
    }

    const task = this.findTask(this.currentPlan.tasks, taskId);
    if (task) {
      // Check if we should retry
      const retryConfig = task.retryConfig;
      const attempts = this.executionState.failedTasks.filter(t => t === taskId).length;

      if (retryConfig && attempts < retryConfig.maxAttempts) {
        task.status = 'pending'; // Allow retry
        this.executionState.failedTasks.push(taskId);
      } else {
        task.status = 'failed';
        this.executionState.failedTasks.push(taskId);

        // Check if we should replan
        if (this.config.enableReplanning) {
          this.handleReplanning({
            type: 'failure',
            reason: error.message,
            timestamp: Date.now(),
            taskId,
          });
        }
      }

      this.currentPlan.updatedAt = Date.now();
    }
  }

  /**
   * Mark task as blocked
   */
  blockTask(taskId: string, reason: string): void {
    if (!this.currentPlan) {
      return;
    }

    const task = this.findTask(this.currentPlan.tasks, taskId);
    if (task && !this.executionState.blockedTasks.includes(taskId)) {
      task.status = 'blocked';
      this.executionState.blockedTasks.push(taskId);

      // Check if we should replan
      if (this.config.enableReplanning) {
        this.handleReplanning({
          type: 'block',
          reason,
          timestamp: Date.now(),
          taskId,
        });
      }

      this.currentPlan.updatedAt = Date.now();
    }
  }

  /**
   * Get current execution state
   */
  getExecutionState(): ExecutionState {
    return { ...this.executionState };
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): TaskPlan | null {
    return this.currentPlan;
  }

  /**
   * Check if plan is complete
   */
  isPlanComplete(): boolean {
    if (!this.currentPlan) {
      return false;
    }

    const allTasks = this.getAllTasks(this.currentPlan.tasks);
    const completedTasks = allTasks.filter(t => t.status === 'completed');

    return completedTasks.length === allTasks.length;
  }

  /**
   * Reset planner state
   */
  reset(): void {
    this.currentPlan = null;
    this.executionState = {
      currentTaskId: null,
      completedTasks: [],
      failedTasks: [],
      blockedTasks: [],
      progress: 0,
      phase: 'planning',
    };
    this.replanningCount = 0;
  }

  /**
   * Private methods
   */

  private buildPlanningPrompt(request: string, context: TaskPlan['context']): string {
    const examples = this.config.useFewShot ? this.getFewShotExamples() : '';

    return `You are an expert task planner. Break down the following user request into a sequence of executable sub-tasks.

User Request: ${request}

Available Tools: ${context.availableTools.join(', ')}
Constraints: ${context.constraints.map(c => c.description).join(', ')}

${examples}

Respond with a JSON plan containing:
1. goal: High-level objective
2. tasks: Array of sub-tasks with:
   - description: What to do
   - type: observation|navigation|interaction|extraction|verification|decision|compound
   - capabilities: Required tools/skills
   - estimatedDuration: Time in milliseconds
   - priority: 0-1 score
   - successCriteria: Array of success conditions
   - failureConditions: Array of failure conditions
3. dependencies: Array of task dependencies

Format your response as valid JSON.`;
  }

  private getFewShotExamples(): string {
    return `
Example 1:
Request: "Find the best laptop under $1000 and add it to cart"
Response:
{
  "goal": "Purchase best laptop under $1000",
  "tasks": [
    {
      "description": "Navigate to products page",
      "type": "navigation",
      "capabilities": ["navigate", "observe"],
      "estimatedDuration": 2000,
      "priority": 0.9,
      "successCriteria": ["On products page"],
      "failureConditions": ["Navigation fails"]
    },
    {
      "description": "Filter laptops by price under $1000",
      "type": "interaction",
      "capabilities": ["filter", "input"],
      "estimatedDuration": 3000,
      "priority": 0.8,
      "successCriteria": ["Filter applied", "Results visible"],
      "failureConditions": ["No results found"]
    },
    {
      "description": "Select best rated laptop from results",
      "type": "decision",
      "capabilities": ["extract", "compare"],
      "estimatedDuration": 5000,
      "priority": 0.9,
      "successCriteria": ["Laptop selected"],
      "failureConditions": ["No suitable laptop found"]
    },
    {
      "description": "Add selected laptop to cart",
      "type": "interaction",
      "capabilities": ["click"],
      "estimatedDuration": 2000,
      "priority": 0.95,
      "successCriteria": ["Item in cart"],
      "failureConditions": ["Add to cart fails"]
    }
  ],
  "dependencies": [
    {"from": "task-1", "to": "task-2", "type": "sequential"},
    {"from": "task-2", "to": "task-3", "type": "sequential"},
    {"from": "task-3", "to": "task-4", "type": "sequential"}
  ]
}
`;
  }

  private parsePlan(response: string, request: string, context: TaskPlan['context']): TaskPlan {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Convert to TaskPlan
      const plan: TaskPlan = {
        id: this.generateId(),
        originalRequest: request,
        status: 'pending',
        goal: parsed.goal || request,
        tasks: this.parseTasks(parsed.tasks || []),
        dependencies: parsed.dependencies || [],
        estimatedDuration: this.calculateTotalDuration(parsed.tasks || []),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        context,
      };

      return plan;
    } catch (error) {
      throw new Error(`Failed to parse plan: ${error}`);
    }
  }

  private parseTasks(taskData: any[]): PlannedTask[] {
    return taskData.map((task, index) => ({
      id: `task-${index + 1}`,
      description: task.description || `Task ${index + 1}`,
      status: 'pending' as PlanStatus,
      type: task.type || 'interaction' as TaskType,
      capabilities: task.capabilities || [],
      estimatedDuration: task.estimatedDuration || 5000,
      priority: task.priority ?? 0.5,
      successCriteria: task.successCriteria || [],
      failureConditions: task.failureConditions || [],
      subTasks: task.subTasks ? this.parseTasks(task.subTasks) : undefined,
    }));
  }

  private calculateTotalDuration(tasks: PlannedTask[]): number {
    let total = 0;
    for (const task of tasks) {
      total += task.estimatedDuration;
      if (task.subTasks) {
        total += this.calculateTotalDuration(task.subTasks);
      }
    }
    return total;
  }

  private optimizePlan(plan: TaskPlan): TaskPlan {
    // Apply optimization strategies
    const optimized = { ...plan };

    // Add parallel execution opportunities
    optimized.dependencies = this.identifyParallelTasks(optimized.tasks, optimized.dependencies);

    // Add verification tasks for high-risk operations
    if (plan.context.preferences.verification !== 'minimal') {
      this.addVerificationTasks(optimized.tasks);
    }

    // Optimize task order
    optimized.tasks = this.optimizeTaskOrder(optimized.tasks);

    return optimized;
  }

  private identifyParallelTasks(tasks: PlannedTask[], dependencies: TaskPlan['dependencies']): TaskPlan['dependencies'] {
    // Analyze task dependencies to find parallel execution opportunities
    const newDependencies = [...dependencies];

    // Tasks with no dependencies can run in parallel
    const tasksWithDeps = new Set(dependencies.map(d => d.to));
    const tasksWithoutDeps = tasks.filter(t => !tasksWithDeps.has(t.id));

    // Mark them as parallel (no sequential dependency needed)
    for (let i = 0; i < tasksWithoutDeps.length; i++) {
      for (let j = i + 1; j < tasksWithoutDeps.length; j++) {
        // These can potentially run in parallel
      }
    }

    return newDependencies;
  }

  private addVerificationTasks(tasks: PlannedTask[]): void {
    // Add verification tasks after high-risk operations
    for (const task of tasks) {
      if (task.priority > 0.8 && task.type === 'interaction') {
        const verificationTask: PlannedTask = {
          id: `${task.id}-verify`,
          parentId: task.id,
          description: `Verify ${task.description}`,
          status: 'pending',
          type: 'verification',
          capabilities: ['observe', 'extract'],
          estimatedDuration: 2000,
          priority: 0.7,
          successCriteria: [`${task.description} successful`],
          failureConditions: [`${task.description} failed`],
        };

        tasks.push(verificationTask);
      }
    }
  }

  private optimizeTaskOrder(tasks: PlannedTask[]): PlannedTask[] {
    // Sort tasks by priority and dependencies
    return [...tasks].sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Shorter tasks first for quicker feedback
      return a.estimatedDuration - b.estimatedDuration;
    });
  }

  private calculateConfidence(plan: TaskPlan, context: TaskPlan['context']): number {
    let confidence = 0.5;

    // Boost confidence if tasks match available tools
    const matchingCapabilities = plan.tasks.filter(task =>
      task.capabilities.some(cap => context.availableTools.includes(cap))
    );
    confidence += (matchingCapabilities.length / plan.tasks.length) * 0.3;

    // Reduce confidence for many dependencies (more failure points)
    const dependencyRatio = plan.dependencies.length / Math.max(plan.tasks.length, 1);
    confidence -= dependencyRatio * 0.1;

    // Boost confidence for reasonable estimated duration
    if (plan.estimatedDuration < 300000) { // Less than 5 minutes
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private getAvailableTasks(): PlannedTask[] {
    if (!this.currentPlan) {
      return [];
    }

    const allTasks = this.getAllTasks(this.currentPlan.tasks);
    return allTasks.filter(task => {
      // Skip completed, failed, or currently running tasks
      if (task.status !== 'pending') {
        return false;
      }

      // Check if dependencies are satisfied
      const taskDeps = this.currentPlan!.dependencies.filter(d => d.to === task.id);
      for (const dep of taskDeps) {
        if (!this.executionState.completedTasks.includes(dep.from)) {
          return false;
        }
      }

      return true;
    });
  }

  private getAllTasks(tasks: PlannedTask[]): PlannedTask[] {
    const allTasks: PlannedTask[] = [...tasks];
    for (const task of tasks) {
      if (task.subTasks) {
        allTasks.push(...this.getAllTasks(task.subTasks));
      }
    }
    return allTasks;
  }

  private findTask(tasks: PlannedTask[], taskId: string): PlannedTask | undefined {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }
      if (task.subTasks) {
        const found = this.findTask(task.subTasks, taskId);
        if (found) return found;
      }
    }
    return undefined;
  }

  private updateExecutionState(phase: ExecutionPhase, currentTaskId: string | null): void {
    this.executionState.phase = phase;
    this.executionState.currentTaskId = currentTaskId;
  }

  private updateProgress(): void {
    if (!this.currentPlan) {
      return;
    }

    const allTasks = this.getAllTasks(this.currentPlan.tasks);
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    this.executionState.progress = completedTasks.length / allTasks.length;
  }

  private handleReplanning(trigger: ReplanningTrigger): void {
    if (this.replanningCount >= this.config.maxReplanningAttempts) {
      console.error('Max replanning attempts reached');
      return;
    }

    this.replanningCount++;
    this.executionState.phase = 'recovery';

    // Log replanning trigger
    console.log('Replanning triggered:', trigger);

    // In a full implementation, this would call the LLM to create a revised plan
    // For now, we'll mark blocked/failed tasks for retry
  }

  private generateId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
