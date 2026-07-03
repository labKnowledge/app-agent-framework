import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedLLMClient } from '../client';

describe('EnhancedLLMClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('completes requests and tracks cost', async () => {
    const client = new EnhancedLLMClient({
      baseURL: 'https://api.example.com/v1',
      model: 'gpt-4',
    });

    const response = await client.complete([{ role: 'user', content: 'Hello' }]);

    expect(response.message.content).toBe('Mock response for testing');
    expect(response.usage?.totalTokens).toBeGreaterThan(0);

    const costs = client.getCosts();
    expect(costs.requestCount).toBe(1);
    expect(costs.totalCost).toBeGreaterThan(0);
  });

  it('retries invokeReAct on transient failures', async () => {
    const client = new EnhancedLLMClient({
      baseURL: 'https://api.example.com/v1',
      model: 'gpt-4',
      maxRetries: 3,
      retryDelay: 100,
    });

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  evaluation_previous_goal: 'ok',
                  memory: 'test',
                  next_goal: 'done',
                  action: { done: true },
                }),
              },
            },
          ],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const promise = client.invokeReAct([{ role: 'user', content: 'test' }]);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.reasoning.nextGoal).toBe('done');
  });

  it('streams completion chunks', async () => {
    const client = new EnhancedLLMClient({
      baseURL: 'https://api.example.com/v1',
      model: 'gpt-4',
    });

    const chunks: string[] = [];
    const promise = client.stream(
      [{ role: 'user', content: 'stream' }],
      undefined,
      (chunk) => {
        if (chunk.content) chunks.push(chunk.content);
      }
    );

    await vi.runAllTimersAsync();
    const response = await promise;

    expect(chunks.length).toBeGreaterThan(0);
    expect(response.message.content).toBe('Mock streaming response');
  });

  it('uses registered prompt templates', async () => {
    const client = new EnhancedLLMClient({
      baseURL: 'https://api.example.com/v1',
      model: 'gpt-4',
    });

    client.registerTemplate({
      id: 'greet',
      name: 'Greet',
      content: 'Hello {{name}}',
      variables: [{ name: 'name', type: 'string', required: true }],
    });

    const response = await client.useTemplate('greet', { name: 'World' });
    expect(response.message.content).toBe('Mock response for testing');
  });

  it('clears conversation history', async () => {
    const client = new EnhancedLLMClient({
      baseURL: 'https://api.example.com/v1',
      model: 'gpt-4',
    });

    await client.complete([{ role: 'user', content: 'one' }]);
    expect(client.getHistory()).toHaveLength(1);

    client.clearContext();
    expect(client.getHistory()).toHaveLength(0);
  });
});
