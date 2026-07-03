/**
 * App-Agent State Manager Package
 *
 * Manages application state tracking, change detection,
 * and history compression.
 */

export { StateManager } from './manager';
export { getStateDiff, isStateSignificant, formatStateDiff } from './diff';

export type * from './types';
