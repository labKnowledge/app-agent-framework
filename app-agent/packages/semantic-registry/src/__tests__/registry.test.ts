import { describe, it, expect } from 'vitest';
import { SemanticRegistry } from '../registry';
import type { EntitySchema, EntityInstance } from '@app-agent/entities';

const productSchema: EntitySchema = {
  type: 'Product',
  name: 'Product',
  description: 'E-commerce product',
  properties: [
    { name: 'name', type: 'string', required: true },
    { name: 'price', type: 'number', required: true },
  ],
  operations: [],
};

describe('SemanticRegistry', () => {
  it('registers schemas and builds context summary', () => {
    const registry = new SemanticRegistry();
    registry.registerSchema(productSchema);

    const summary = registry.getContextSummary();
    expect(summary).toContain('Product');
    expect(registry.getSchema('Product')).toBe(productSchema);
  });

  it('registers and queries entity instances', async () => {
    const registry = new SemanticRegistry();
    registry.registerSchema(productSchema);

    const instance: EntityInstance = {
      id: 'prod-1',
      type: 'Product',
      properties: { name: 'Laptop', price: 899 },
      metadata: { source: 'catalog', confidence: 1, lastUpdated: Date.now() },
    };

    await registry.registerInstance(instance);

    const results = registry.query({
      type: 'Product',
      filters: [{ property: 'price', operator: 'less', value: 1000 }],
    });

    expect(results).toHaveLength(1);
    expect(results[0].properties.name).toBe('Laptop');
  });

  it('filters instances by search term', async () => {
    const registry = new SemanticRegistry();
    registry.registerSchema(productSchema);

    await registry.registerInstance({
      id: 'prod-1',
      type: 'Product',
      properties: { name: 'Gaming Laptop', price: 1200 },
      metadata: { source: 'catalog', confidence: 1, lastUpdated: Date.now() },
    });

    await registry.registerInstance({
      id: 'prod-2',
      type: 'Product',
      properties: { name: 'Office Mouse', price: 25 },
      metadata: { source: 'catalog', confidence: 1, lastUpdated: Date.now() },
    });

    const results = registry.query({ search: 'laptop' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('prod-1');
  });

  it('sorts and paginates query results', async () => {
    const registry = new SemanticRegistry();
    registry.registerSchema(productSchema);

    for (let i = 0; i < 3; i++) {
      await registry.registerInstance({
        id: `prod-${i}`,
        type: 'Product',
        properties: { name: `Item ${i}`, price: i * 100 },
        metadata: { source: 'catalog', confidence: 1, lastUpdated: Date.now() },
      });
    }

    const results = registry.query({
      sort: [{ property: 'price', direction: 'desc' }],
      pagination: { offset: 0, limit: 2 },
    });

    expect(results).toHaveLength(2);
    expect(results[0].properties.price).toBe(200);
  });
});
