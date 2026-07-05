/**
 * Tool validation utilities
 *
 * Helper functions for schema validation and error formatting
 */

import { z } from 'zod';
import type { Tool } from './types';

/**
 * Format Zod error for user-friendly display
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error.errors.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    const message = issue.message;

    switch (issue.code) {
      case 'invalid_type':
        return `${path}: Expected ${issue.expected}, but received ${issue.received}`;
      case 'invalid_enum_value':
        return `${path}: Invalid value. Expected one of: ${issue.options?.join(', ')}`;
      case 'too_small':
        return `${path}: Value is too small. Minimum: ${issue.minimum} (inclusive: ${issue.inclusive})`;
      case 'too_big':
        return `${path}: Value is too big. Maximum: ${issue.maximum} (inclusive: ${issue.inclusive})`;
      case 'custom':
        return `${path}: ${issue.message}`;
      default:
        return `${path}: ${message}`;
    }
  });

  return issues.join('; ');
}

/**
 * Validate tool parameters with detailed error reporting
 */
export function validateToolParams<T>(
  tool: Tool<T>,
  params: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = tool.inputSchema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: formatZodError(error),
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get tool parameter examples from schema
 */
export function getParamExamples<T>(tool: Tool<T>): Record<string, unknown> {
  const examples: Record<string, unknown> = {};

  // Try to extract examples from tool metadata
  if (tool.metadata.examples.length > 0) {
    return tool.metadata.examples[0].parameters;
  }

  return examples;
}

/**
 * Generate a human-readable parameter description
 */
export function describeParams<T>(tool: Tool<T>): string {
  const schema = tool.inputSchema;

  // Try to get Zod schema shape
  if ('shape' in schema && typeof schema.shape === 'object') {
    const shape = (schema as any).shape;
    const descriptions: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodObj = value as z.ZodTypeAny;
      const description = zodObj.description || key;
      const isOptional = zodObj.isOptional();

      descriptions.push(
        `- ${key}${isOptional ? '?' : ''}: ${description}${isOptional ? ' (optional)' : ''}`
      );
    }

    return descriptions.length > 0 ? descriptions.join('\n') : 'No parameters';
  }

  return 'Parameters not described';
}

/**
 * Check if tool parameters are valid without throwing
 */
export function isValidToolParams<T>(tool: Tool<T>, params: unknown): boolean {
  const result = tool.inputSchema.safeParse(params);
  return result.success;
}

/**
 * Get required parameter names
 */
export function getRequiredParams<T>(tool: Tool<T>): string[] {
  const schema = tool.inputSchema;

  if ('shape' in schema && typeof schema.shape === 'object') {
    const shape = (schema as any).shape;
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodObj = value as z.ZodTypeAny;
      // Check if the field is not optional and not nullable
      if (!zodObj.isOptional() && !zodObj.isNullable()) {
        required.push(key);
      }
    }

    return required;
  }

  return [];
}

/**
 * Get optional parameter names
 */
export function getOptionalParams<T>(tool: Tool<T>): string[] {
  const schema = tool.inputSchema;

  if ('shape' in schema && typeof schema.shape === 'object') {
    const shape = (schema as any).shape;
    const optional: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodObj = value as z.ZodTypeAny;
      // Check if the field is optional or nullable
      if (zodObj.isOptional() || zodObj.isNullable()) {
        optional.push(key);
      }
    }

    return optional;
  }

  return [];
}