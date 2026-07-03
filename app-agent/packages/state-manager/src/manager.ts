/**
 * State Manager
 *
 * Manages application state tracking, change detection, and history
 */

import type { AppState } from '@app-agent/entities';
import type {
  StateManagerConfig,
  StateDiff,
  StateHistory,
  CompressedHistoryEntry,
  StateChangeListener,
} from './types';
import { getStateDiff, isStateSignificant, formatStateDiff } from './diff';

/**
 * State Manager Class
 */
export class StateManager {
  private config: StateManagerConfig;
  private currentState: AppState | null = null;
  private lastStateCheckTime = 0;
  private listeners: Set<StateChangeListener> = new Set();
  private history: StateHistory = {
    entries: [],
    totalCaptured: 0,
  };
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: StateManagerConfig) {
    this.config = config;
  }

  /**
   * Get current application state
   */
  async getCurrentState(): Promise<AppState> {
    const state = await this.config.getAppState();
    this.currentState = state;
    return state;
  }

  /**
   * Start tracking state changes
   */
  startTracking(intervalMs = 1000): void {
    if (this.checkInterval) {
      return; // Already tracking
    }

    this.checkInterval = setInterval(async () => {
      await this.checkStateChanges();
    }, intervalMs);

    // Initial state capture
    this.getCurrentState().then((state) => {
      this.addToHistory(state, true);
    });
  }

  /**
   * Stop tracking state changes
   */
  stopTracking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check for state changes
   */
  async checkStateChanges(): Promise<void> {
    const now = Date.now();
    const threshold = this.config.stateChangeThreshold || 1000;

    if (now - this.lastStateCheckTime < threshold) {
      return;
    }

    this.lastStateCheckTime = now;

    const newState = await this.getCurrentState();

    if (this.currentState) {
      const diff = getStateDiff(this.currentState, newState);

      if (diff.hasChanges && isStateSignificant(diff)) {
        // Notify listeners
        this.notifyListeners(diff, newState, this.currentState);

        // Call callback if provided
        if (this.config.onStateChange) {
          this.config.onStateChange(diff, newState, this.currentState);
        }

        // Add to history if significant
        this.addToHistory(newState, true);
      }
    }
  }

  /**
   * Get state difference
   */
  getStateDiff(oldState: AppState, newState: AppState): StateDiff {
    return getStateDiff(oldState, newState);
  }

  /**
   * Check if state is significant
   */
  isStateSignificant(diff: StateDiff): boolean {
    return isStateSignificant(diff);
  }

  /**
   * Format state diff for display
   */
  formatStateDiff(diff: StateDiff): string {
    return formatStateDiff(diff);
  }

  /**
   * Add state to history
   */
  private addToHistory(state: AppState, significant: boolean): void {
    const entry: CompressedHistoryEntry = {
      timestamp: Date.now(),
      state: this.compressState(state),
      significant,
    };

    this.history.entries.push(entry);
    this.history.totalCaptured++;

    // Enforce history limit
    const limit = this.config.historyLimit || 100;
    if (this.history.entries.length > limit) {
      this.history.entries.shift();
    }
  }

  /**
   * Compress state for storage
   */
  private compressState(state: AppState): Partial<AppState> {
    // For now, return shallow copy
    // In future, implement smarter compression
    return {
      currentView: state.currentView,
      user: {
        ...state.user,
        attributes: state.user.attributes ? { ...state.user.attributes } : undefined,
      },
      context: { ...state.context },
      timestamp: state.timestamp,
    };
  }

  /**
   * Get state history
   */
  getHistory(): StateHistory {
    return {
      entries: [...this.history.entries],
      totalCaptured: this.history.totalCaptured,
    };
  }

  /**
   * Compress history (reduce size by merging similar entries)
   */
  compressHistory(): StateHistory {
    const compressed: CompressedHistoryEntry[] = [];
    let currentEntry: CompressedHistoryEntry | null = null;

    for (const entry of this.history.entries) {
      if (!currentEntry) {
        currentEntry = { ...entry };
        continue;
      }

      // If entries are similar, merge them
      if (this.areStatesSimilar(currentEntry.state, entry.state)) {
        currentEntry.timestamp = entry.timestamp; // Use latest timestamp
      } else {
        compressed.push(currentEntry);
        currentEntry = { ...entry };
      }
    }

    if (currentEntry) {
      compressed.push(currentEntry);
    }

    this.history.entries = compressed;
    return this.getHistory();
  }

  /**
   * Check if two states are similar
   */
  private areStatesSimilar(state1: Partial<AppState>, state2: Partial<AppState>): boolean {
    if (!state1 || !state2) {
      return false;
    }

    // Compare key fields
    return (
      state1.currentView === state2.currentView &&
      state1.user?.id === state2.user?.id &&
      state1.user?.role === state2.user?.role
    );
  }

  /**
   * Add state change listener
   */
  addListener(listener: StateChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove state change listener
   */
  removeListener(listener: StateChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(diff: StateDiff, newState: AppState, oldState: AppState): void {
    for (const listener of this.listeners) {
      try {
        listener(diff, newState, oldState);
      } catch (error) {
        console.error('State change listener error:', error);
      }
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = {
      entries: [],
      totalCaptured: 0,
    };
  }

  /**
   * Dispose of state manager
   */
  dispose(): void {
    this.stopTracking();
    this.listeners.clear();
    this.clearHistory();
    this.currentState = null;
  }
}
