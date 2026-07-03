/**
 * Built-in tool Zod schemas
 */

import { z } from 'zod';

export const toolSchemas = {
  done: z.object({}),
  wait: z.object({
    duration: z.number().min(0).default(1000),
  }),
  click: z.object({
    index: z.number().int().nonnegative(),
  }),
  input: z.object({
    index: z.number().int().nonnegative(),
    text: z.string(),
  }),
  select: z.object({
    index: z.number().int().nonnegative(),
    value: z.string(),
  }),
  scroll: z.object({
    direction: z.enum(['up', 'down', 'left', 'right']).default('down'),
    amount: z.number().min(0).default(100),
  }),
} as const;

export type ToolSchemaName = keyof typeof toolSchemas;
