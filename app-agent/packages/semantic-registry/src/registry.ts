/**
 * Semantic Entity Registry — runtime implementation
 */

import EventEmitter from 'eventemitter3';
import type {
  EntitySchema,
  EntityInstance,
  EntityQuery,
  EntityRegistryConfig,
  EntityChangeEvent,
  EntityFilter,
} from '@gakwaya/app-agent-entities';

export class SemanticRegistry extends EventEmitter {
  private schemas = new Map<string, EntitySchema>();
  private instances = new Map<string, EntityInstance>();
  private config: Required<EntityRegistryConfig>;

  constructor(config: EntityRegistryConfig = {}) {
    super();
    this.config = {
      autoDiscovery: config.autoDiscovery ?? false,
      validationStrictness: config.validationStrictness ?? 'lenient',
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL ?? 60000,
      maxEntities: config.maxEntities ?? 1000,
    };
  }

  registerSchema(schema: EntitySchema): void {
    this.schemas.set(schema.type, schema);
    this.emit('schema_registered', schema);
  }

  getSchema(type: string): EntitySchema | undefined {
    return this.schemas.get(type);
  }

  getAllSchemas(): EntitySchema[] {
    return Array.from(this.schemas.values());
  }

  async registerInstance(instance: EntityInstance): Promise<void> {
    const schema = this.schemas.get(instance.type);
    if (schema?.lifecycle?.beforeCreate) {
      await schema.lifecycle.beforeCreate(instance);
    }

    this.instances.set(instance.id, instance);

    const event: EntityChangeEvent = {
      eventType: 'created',
      entity: instance,
      timestamp: Date.now(),
    };
    this.emit('entity_changed', event);

    if (schema?.lifecycle?.afterCreate) {
      await schema.lifecycle.afterCreate(instance);
    }
  }

  getInstance(id: string): EntityInstance | undefined {
    return this.instances.get(id);
  }

  query(query: EntityQuery): EntityInstance[] {
    let results = Array.from(this.instances.values());

    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      results = results.filter((i) => types.includes(i.type));
    }

    if (query.filters) {
      results = results.filter((instance) =>
        query.filters!.every((filter) => this.matchesFilter(instance, filter))
      );
    }

    if (query.search) {
      const term = query.search.toLowerCase();
      results = results.filter((instance) =>
        JSON.stringify(instance.properties).toLowerCase().includes(term)
      );
    }

    if (query.sort) {
      for (const sort of [...query.sort].reverse()) {
        results.sort((a, b) => {
          const av = a.properties[sort.property];
          const bv = b.properties[sort.property];
          const cmp = String(av).localeCompare(String(bv));
          return sort.direction === 'asc' ? cmp : -cmp;
        });
      }
    }

    if (query.pagination) {
      const { offset, limit } = query.pagination;
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  getContextSummary(): string {
    const schemas = this.getAllSchemas();
    if (schemas.length === 0) return '';

    return schemas
      .map((s) => `- ${s.name}: ${s.description} (${s.properties.length} properties)`)
      .join('\n');
  }

  private matchesFilter(instance: EntityInstance, filter: EntityFilter): boolean {
    const value = instance.properties[filter.property];

    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'notEquals':
        return value !== filter.value;
      case 'contains':
        return String(value).includes(String(filter.value));
      case 'exists':
        return value !== undefined && value !== null;
      case 'in':
        return filter.values?.includes(value) ?? false;
      case 'greater':
        return Number(value) > Number(filter.value);
      case 'less':
        return Number(value) < Number(filter.value);
      default:
        return true;
    }
  }
}
