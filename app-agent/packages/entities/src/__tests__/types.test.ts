import { describe, it, expect } from 'vitest';
import { toolSchemas } from '../tool-schemas';

describe('@app-agent/entities', () => {
  it('validates built-in tool schemas', () => {
    expect(toolSchemas.click.parse({ index: 0 })).toEqual({ index: 0 });
    expect(toolSchemas.wait.parse({})).toEqual({ duration: 1000 });
    expect(toolSchemas.scroll.parse({})).toEqual({
      direction: 'down',
      amount: 100,
    });
  });

  it('rejects invalid click parameters', () => {
    expect(() => toolSchemas.click.parse({ index: -1 })).toThrow();
  });
});
