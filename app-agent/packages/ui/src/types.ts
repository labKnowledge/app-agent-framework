/**
 * UI Types
 */

import type { AgentStatus, HistoricalEvent } from '@app-agent/core';

/**
 * Panel configuration
 */
export interface PanelConfig {
  /** Panel position */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Panel theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Whether panel is open by default */
  defaultOpen?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Custom z-index */
  zIndex?: number;
}

/**
 * Panel state
 */
export interface PanelState {
  /** Whether panel is open */
  open: boolean;
  /** Current agent status */
  status: AgentStatus;
  /** Current activity */
  activity: string;
  /** Execution history */
  history: HistoricalEvent[];
  /** Current task */
  task: string;
}

/**
 * SimulatorMask configuration
 */
export interface SimulatorMaskConfig {
  /** Custom color for mask */
  color?: string;
  /** Custom opacity */
  opacity?: number;
  /** Custom z-index */
  zIndex?: number;
  /** Whether to show cursor animation */
  showCursor?: boolean;
}

/**
 * Cursor position
 */
export interface CursorPosition {
  x: number;
  y: number;
}
