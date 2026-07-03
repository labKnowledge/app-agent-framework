import { describe, it, expect, beforeEach } from 'vitest';
import { TaskPlanner } from '../planner';
import type { PlanContext } from '../types';

const mockContext: PlanContext = {
  appState: { view: 'shop' },
  availableTools: ['navigate', 'click', 'filter', 'extract'],
  constraints: [{ type: 'time', description: 'Under 5 minutes', value: 300000 }],
  preferences: {
    speed: 'normal',
    riskTolerance: 'medium',
    verification: 'minimal',
  },
};

const mockPlanResponse = JSON.stringify({
  goal: 'Purchase laptop',
  tasks: [
    {
      description: 'Navigate to products',
      type: 'navigation',
      capabilities: ['navigate'],
      estimatedDuration: 2000,
      priority: 0.9,
      successCriteria: ['On products page'],
      failureConditions: ['Navigation fails'],
    },
    {
      description: 'Filter by price',
      type: 'interaction',
      capabilities: ['filter'],
      estimatedDuration: 3000,
      priority: 0.8,
      successCriteria: ['Filter applied'],
      failureConditions: ['No results'],
    },
  ],
  dependencies: [{ from: 'task-1', to: 'task-2', type: 'sequential' }],
});

describe('TaskPlanner', () => {
  let planner: TaskPlanner;

  beforeEach(() => {
    planner = new TaskPlanner();
  });

  it('creates a plan from LLM response', async () => {
    const result = await planner.createPlan(
      'Find laptop under $1000',
      mockContext,
      async () => mockPlanResponse
    );

    expect(result.plan.goal).toBe('Purchase laptop');
    expect(result.plan.tasks.length).toBeGreaterThanOrEqual(2);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('returns next task respecting dependencies', async () => {
    await planner.createPlan('test', mockContext, async () => mockPlanResponse);

    const first = planner.getNextTask();
    expect(first?.id).toBe('task-1');

    planner.completeTask('task-1');
    const second = planner.getNextTask();
    expect(second?.id).toBe('task-2');
  });

  it('marks plan complete when all tasks finish', async () => {
    await planner.createPlan('test', mockContext, async () => mockPlanResponse);

    planner.completeTask('task-1');
    planner.completeTask('task-2');

    expect(planner.isPlanComplete()).toBe(true);
    expect(planner.getExecutionState().progress).toBe(1);
  });

  it('records failed tasks in execution state', async () => {
    await planner.createPlan('test', mockContext, async () => mockPlanResponse);

    const task = planner.getNextTask()!;
    planner.failTask(task.id, new Error('permanent failure'));

    expect(planner.getExecutionState().failedTasks).toContain('task-1');
    expect(task.status).toBe('failed');
  });

  it('resets planner state', async () => {
    await planner.createPlan('test', mockContext, async () => mockPlanResponse);
    planner.reset();

    expect(planner.getCurrentPlan()).toBeNull();
    expect(planner.getNextTask()).toBeNull();
  });
});
