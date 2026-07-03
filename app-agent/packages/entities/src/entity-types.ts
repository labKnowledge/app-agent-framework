/**
 * Semantic Entity Registry Types
 *
 * Domain-level understanding system for business concepts
 * and semantic relationships
 */

/**
 * Entity definition schema
 */
export interface EntitySchema {
  /** Entity type identifier */
  type: string;
  /** Entity type name */
  name: string;
  /** Description */
  description: string;
  /** Property definitions */
  properties: EntityProperty[];
  /** Relationships to other entities */
  relationships: EntityRelationship[];
  /** Validation rules */
  validation?: EntityValidation[];
  /** Lifecycle hooks */
  lifecycle?: EntityLifecycle;
  /** Metadata */
  metadata: EntityMetadata;
}

/**
 * Entity property definition
 */
export interface EntityProperty {
  /** Property name */
  name: string;
  /** Property type */
  type: EntityPropertyType;
  /** Required flag */
  required: boolean;
  /** Description */
  description?: string;
  /** Default value */
  defaultValue?: unknown;
  /** Validation rules */
  validation?: PropertyValidation[];
  /** Derived property calculation */
  derived?: {
    from: string[];
    calculation: string;
  };
}

/**
 * Entity property types
 */
export type EntityPropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'array'
  | 'object'
  | 'reference'  // Reference to another entity
  | 'computed'; // Computed from other properties

/**
 * Entity relationship
 */
export interface EntityRelationship {
  /** Relationship name */
  name: string;
  /** Target entity type */
  targetType: string;
  /** Relationship type */
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  /** Bidirectional flag */
  bidirectional: boolean;
  /** Inverse relationship name */
  inverse?: string;
  /** Description */
  description?: string;
}

/**
 * Entity validation rules
 */
export interface EntityValidation {
  /** Rule name */
  name: string;
  /** Rule type */
  type: 'unique' | 'constraint' | 'custom';
  /** Rule expression */
  expression?: string;
  /** Error message */
  errorMessage?: string;
}

/**
 * Property validation
 */
export interface PropertyValidation {
  /** Validation type */
  type: 'range' | 'pattern' | 'length' | 'custom';
  /** Validation parameters */
  params: Record<string, unknown>;
  /** Error message */
  errorMessage?: string;
}

/**
 * Entity lifecycle hooks
 */
export interface EntityLifecycle {
  /** Called before entity creation */
  beforeCreate?: (entity: EntityInstance) => Promise<void>;
  /** Called after entity creation */
  afterCreate?: (entity: EntityInstance) => Promise<void>;
  /** Called before entity update */
  beforeUpdate?: (entity: EntityInstance, changes: Record<string, unknown>) => Promise<void>;
  /** Called after entity update */
  afterUpdate?: (entity: EntityInstance) => Promise<void>;
  /** Called before entity deletion */
  beforeDelete?: (entity: EntityInstance) => Promise<void>;
  /** Called after entity deletion */
  afterDelete?: (entityId: string) => Promise<void>;
}

/**
 * Entity metadata
 */
export interface EntityMetadata {
  /** Entity category */
  category: string;
  /** Tags */
  tags: string[];
  /** Display template */
  displayTemplate?: string;
  /** Icon */
  icon?: string;
  /** Color for UI */
  color?: string;
}

/**
 * Entity instance
 */
export interface EntityInstance {
  /** Instance ID */
  id: string;
  /** Entity type */
  type: string;
  /** Property values */
  properties: Record<string, unknown>;
  /** Related entities */
  relations: Record<string, string | string[]>;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Validity flag */
  valid: boolean;
  /** Validation errors */
  validationErrors: string[];
}

/**
 * Entity query
 */
export interface EntityQuery {
  /** Entity type filter */
  type?: string | string[];
  /** Property filters */
  filters?: EntityFilter[];
  /** Relationship filters */
  relations?: RelationFilter[];
  /** Full-text search */
  search?: string;
  /** Sorting */
  sort?: EntitySort[];
  /** Pagination */
  pagination?: {
    offset: number;
    limit: number;
  };
}

/**
 * Entity filter
 */
export interface EntityFilter {
  /** Property name */
  property: string;
  /** Comparison operator */
  operator: 'equals' | 'notEquals' | 'greater' | 'less' | 'contains' | 'exists' | 'in';
  /** Value to compare */
  value?: unknown;
  /** Values for 'in' operator */
  values?: unknown[];
}

/**
 * Relationship filter
 */
export interface RelationFilter {
  /** Relationship name */
  relation: string;
  /** Target entity type */
  targetType: string;
  /** Target entity criteria */
  criteria: EntityFilter[];
}

/**
 * Entity sort
 */
export interface EntitySort {
  /** Property name */
  property: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Entity extraction result
 */
export interface EntityExtraction {
  /** Extracted entities */
  entities: EntityInstance[];
  /** Extraction confidence (0-1) */
  confidence: number;
  /** Extraction metadata */
  metadata: ExtractionMetadata;
}

/**
 * Extraction metadata
 */
export interface ExtractionMetadata {
  /** Extraction method */
  method: 'dom' | 'state' | 'api' | 'hybrid';
  /** Source information */
  source: {
    url?: string;
    selector?: string;
    stateKey?: string;
  };
  /** Timestamp */
  timestamp: number;
}

/**
 * Entity registry configuration
 */
export interface EntityRegistryConfig {
  /** Auto-discovery enabled */
  autoDiscovery?: boolean;
  /** Validation strictness */
  validationStrictness?: 'strict' | 'lenient' | 'disabled';
  /** Caching enabled */
  enableCaching?: boolean;
  /** Cache TTL */
  cacheTTL?: number;
  /** Maximum entities per type */
  maxEntities?: number;
}

/**
 * Entity change event
 */
export interface EntityChangeEvent {
  /** Event type */
  eventType: 'created' | 'updated' | 'deleted' | 'relation_changed';
  /** Entity instance */
  entity: EntityInstance;
  /** Change details */
  changes?: Record<string, { oldValue: unknown; newValue: unknown }>;
  /** Timestamp */
  timestamp: number;
}
