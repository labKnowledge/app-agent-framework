/**
 * State Manager Types
 */

import type { AppState } from '@app-agent/entities';

/**
 * State difference between two states
 */
export interface StateDiff {
  /** Whether states are different */
  hasChanges: boolean;
  /** Changed fields and their values */
  changes: FieldChange[];
  /** Type of change */
  changeType: 'none' | 'minor' | 'moderate' | 'major';
}

/**
 * Field change details
 */
export interface FieldChange {
  /** Field path (e.g., 'user.id', 'currentView') */
  path: string;
  /** Old value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
  /** Type of change */
  type: 'added' | 'removed' | 'updated' | 'unchanged';
}

/**
 * State manager configuration
 */
export interface StateManagerConfig {
  /** Callback to get current application state */
  getAppState: () => Promise<AppState>;
  /** Time threshold for debouncing state changes (ms) */
  stateChangeThreshold?: number;
  /** Maximum history size */
  historyLimit?: number;
  /** Callback when significant state change detected */
  onStateChange?: (diff: StateDiff, newState: AppState, oldState: AppState) => void;
}

/**
 * Compressed history entry
 */
export interface CompressedHistoryEntry {
  /** Timestamp */
  timestamp: number;
  /** State snapshot (compressed) */
  state: Partial<AppState>;
  /** Whether this was a significant change */
  significant: boolean;
}

/**
 * State history
 */
export interface StateHistory {
  /** Compressed history entries */
  entries: CompressedHistoryEntry[];
  /** Total number of states captured (including uncompressed) */
  totalCaptured: number;
}

/**
 * State change listener
 */
export type StateChangeListener = (diff: StateDiff, newState: AppState, oldState: AppState) => void;
