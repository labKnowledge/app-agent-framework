/**
 * State Difference Calculation
 */

import type { AppState, StateDiff, FieldChange } from './types';

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
): void {
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const fieldPath = path ? `${path}.${key}` : key;
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (oldValue === newValue) {
      continue;
    }

    if (oldValue === undefined) {
      changes.push({
        path: fieldPath,
        oldValue,
        newValue,
        type: 'added',
      });
    } else if (newValue === undefined) {
      changes.push({
        path: fieldPath,
        oldValue,
        newValue,
        type: 'removed',
      });
    } else if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
      // Recurse into nested objects
      compareFields(oldValue as Record<string, unknown>, newValue as Record<string, unknown>, fieldPath, changes);
    } else {
      changes.push({
        path: fieldPath,
        oldValue,
        newValue,
        type: 'updated',
      });
    }
  }
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
