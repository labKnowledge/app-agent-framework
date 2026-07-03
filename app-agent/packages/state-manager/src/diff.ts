/**
 * State Difference Calculation
 */

import type { AppState } from '@app-agent/entities';
import type { StateDiff, FieldChange } from './types';

/**
 * Calculate difference between two states
 */
export function getStateDiff(oldState: AppState, newState: AppState): StateDiff {
  const changes: FieldChange[] = [];

  // Compare top-level fields
  compareFields(oldState, newState, '', changes);

  const hasChanges = changes.length > 0;
  const changeType = determineChangeType(changes);

  return {
    hasChanges,
    changes,
    changeType,
  };
}

/**
 * Compare fields recursively
 */
function compareFields(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  path: string,
  changes: FieldChange[],
  visited = new WeakSet(),
): void {
  // Circular reference detection
  if (visited.has(oldObj) || visited.has(newObj)) {
    return;
  }
  visited.add(oldObj);
  visited.add(newObj);

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const fieldPath = path ? `${path}.${key}` : key;
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    // Handle null/undefined
    if (oldValue === newValue) {
      continue;
    }

    // Handle arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (!arraysEqual(oldValue, newValue)) {
        changes.push({
          path: fieldPath,
          oldValue,
          newValue,
          type: 'updated',
        });
      }
      continue;
    }

    // Handle nested objects
    if (typeof oldValue === 'object' && typeof newValue === 'object' &&
        oldValue !== null && newValue !== null && !Array.isArray(oldValue) && !Array.isArray(newValue)) {
      compareFields(oldValue as Record<string, unknown>, newValue as Record<string, unknown>,
                   fieldPath, changes, visited);
      continue;
    }

    // Primitive values
    changes.push({
      path: fieldPath,
      oldValue,
      newValue,
      type: oldValue === undefined ? 'added' : newValue === undefined ? 'removed' : 'updated',
    });
  }
}

/**
 * Check if two arrays are equal
 */
function arraysEqual(arr1: unknown[], arr2: unknown[]): boolean {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, i) => val === arr2[i]);
}

/**
 * Determine significance of change
 */
function determineChangeType(changes: FieldChange[]): 'none' | 'minor' | 'moderate' | 'major' {
  if (changes.length === 0) {
    return 'none';
  }

  // Check for major changes
  const majorPaths = ['user.id', 'user.role', 'user.isAuthenticated'];
  const hasMajorChange = changes.some(change => majorPaths.some(path => change.path.startsWith(path)));

  if (hasMajorChange) {
    return 'major';
  }

  // Check for moderate changes
  const moderatePaths = ['currentView', 'user.attributes'];
  const hasModerateChange = changes.some(change =>
    moderatePaths.some(path => change.path.startsWith(path)),
  );

  if (hasModerateChange || changes.length > 3) {
    return 'moderate';
  }

  // Otherwise minor
  return 'minor';
}

/**
 * Check if state change is significant
 */
export function isStateSignificant(diff: StateDiff): boolean {
  return diff.changeType === 'moderate' || diff.changeType === 'major';
}

/**
 * Format state diff for display
 */
export function formatStateDiff(diff: StateDiff): string {
  if (!diff.hasChanges) {
    return 'No changes';
  }

  const lines = diff.changes.map(change => {
    const symbol = change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~';
    const oldValue = JSON.stringify(change.oldValue);
    const newValue = JSON.stringify(change.newValue);
    return `  ${symbol} ${change.path}: ${oldValue} → ${newValue}`;
  });

  return `State changes (${diff.changeType}):\n${lines.join('\n')}`;
}
