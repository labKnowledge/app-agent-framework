import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowEngine } from '../engine';
import type { Workflow } from '../types';

function createTestWorkflow(): Workflow {
  return {
    id: 'checkout-workflow',
    name: 'Checkout',
    description: 'Simple checkout flow',
    version: '1.0.0',
    steps: [
      {
        id: 'step-1',
        name: 'Add to cart',
        type: 'action',
        action: { type: 'tool', toolName: 'click', parameters: { selector: '#add-cart' } },
      },
      {
        id: 'step-2',
        name: 'Wait for cart',
        type: 'wait',
        action: { type: 'wait', duration: 1 },
        dependencies: ['step-1'],
      },
    ],
    variables: [],
    errorStrategy: 'stop',
    options: { enableCheckpoints: false, enablePersistence: false },
    metadata: { tags: ['checkout'], category: 'ecommerce' },
  };
}

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine({
      enablePersistence: false,
      checkpointInterval: 60_000_000,
    });
  });

  afterEach(() => {
    engine.dispose();
  });

  it('registers and retrieves workflows', () => {
    const workflow = createTestWorkflow();
    engine.registerWorkflow(workflow);

    expect(engine.getWorkflow(workflow.id)).toBe(workflow);
  });

  it('executes workflow steps sequentially', async () => {
    const workflow = createTestWorkflow();
    engine.registerWorkflow(workflow);

    const executionId = await engine.startExecution(workflow.id);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const execution = engine.getExecution(executionId);
    expect(execution?.status).toBe('completed');
    expect(execution?.completedSteps).toEqual(['step-1', 'step-2']);
  });

  it('pauses running execution', async () => {
    const slowWorkflow: Workflow = {
      ...createTestWorkflow(),
      id: 'slow-workflow',
      steps: [
        {
          id: 'step-1',
          name: 'Long wait',
          type: 'wait',
          action: { type: 'wait', duration: 1000 },
        },
      ],
    };
    engine.registerWorkflow(slowWorkflow);

    const executionId = await engine.startExecution(slowWorkflow.id);
    await new Promise((resolve) => setTimeout(resolve, 20));
    engine.pauseExecution(executionId);

    expect(engine.getExecution(executionId)?.status).toBe('paused');
  });

  it('cancels execution', async () => {
    const workflow = createTestWorkflow();
    engine.registerWorkflow(workflow);

    const executionId = await engine.startExecution(workflow.id);
    engine.cancelExecution(executionId);

    expect(engine.getExecution(executionId)?.status).toBe('cancelled');
  });

  it('emits workflow events', async () => {
    const workflow = createTestWorkflow();
    engine.registerWorkflow(workflow);

    const started = vi.fn();
    engine.on('workflow_event', (event) => {
      if (event.eventType === 'started') started(event);
    });

    await engine.startExecution(workflow.id);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(started).toHaveBeenCalled();
  });
});
