# @gakwaya/app-agent-state-manager

State management integration for App-Agent - tracks application state changes and maintains history.

## Features

- ✅ **State Tracking**: Automatic state change detection
- ✅ **Change Detection**: Diff algorithm for state comparison
- ✅ **Significance Scoring**: Classifies changes as minor/moderate/major
- ✅ **History Management**: Compresses and maintains state history
- ✅ **Event System**: Listeners for state changes
- ✅ **Debouncing**: Configurable threshold for change detection

## Usage

```typescript
import { StateManager } from '@gakwaya/app-agent-state-manager';

const stateManager = new StateManager({
  getAppState: async () => ({
    currentView: 'shop',
    user: { id: '123', role: 'customer', isAuthenticated: true },
    context: { cartItems: [] },
    timestamp: Date.now(),
  }),
  stateChangeThreshold: 1000,
  historyLimit: 100,
  onStateChange: (diff, newState, oldState) => {
    console.log('State changed:', diff.changeType);
    console.log('Changes:', diff.changes);
  },
});

// Start automatic tracking
stateManager.startTracking(1000);

// Manual state check
const currentState = await stateManager.getCurrentState();

// Compare two states
const diff = stateManager.getStateDiff(oldState, newState);
console.log(stateManager.formatStateDiff(diff));

// Listen to changes
stateManager.addListener((diff, newState, oldState) => {
  console.log('Significant change:', diff.changeType);
});

// Get history
const history = stateManager.getHistory();

// Compress history to save space
stateManager.compressHistory();

// Clean up
stateManager.dispose();
```

## API

### StateManager

#### Constructor

```typescript
new StateManager(config: StateManagerConfig)
```

**StateManagerConfig:**

- `getAppState`: Callback to get current application state
- `stateChangeThreshold`: Time threshold for debouncing (default: 1000ms)
- `historyLimit`: Maximum history entries (default: 100)
- `onStateChange`: Callback when significant change detected

#### Methods

**getCurrentState(): Promise<AppState>**

- Get current application state

**startTracking(intervalMs?): void**

- Start automatic state change tracking
- Interval: Check interval in ms (default: 1000)

**stopTracking(): void**

- Stop automatic tracking

**getStateDiff(oldState, newState): StateDiff**

- Calculate difference between two states

**isStateSignificant(diff): boolean**

- Check if change is significant (moderate or major)

**formatStateDiff(diff): string**

- Format state diff for display

**getHistory(): StateHistory**

- Get compressed state history

**compressHistory(): StateHistory**

- Compress history by merging similar entries

**addListener(listener): void**

- Add state change listener

**removeListener(listener): void**

- Remove state change listener

**clearHistory(): void**

- Clear all history

**dispose(): void**

- Clean up resources

## State Types

### StateDiff

```typescript
interface StateDiff {
  hasChanges: boolean;
  changes: FieldChange[];
  changeType: 'none' | 'minor' | 'moderate' | 'major';
}
```

### FieldChange

```typescript
interface FieldChange {
  path: string; // e.g., 'user.id', 'currentView'
  oldValue: unknown;
  newValue: unknown;
  type: 'added' | 'removed' | 'updated';
}
```

## Change Significance

Changes are classified as:

- **None**: No changes detected
- **Minor**: Small changes in context or timestamp
- **Moderate**: View changes or user attribute updates (3+ fields)
- **Major**: User identity, role, or authentication changes

## History Compression

The state manager automatically compresses history by:

- Merging similar consecutive states
- Limiting total entries (configurable)
- Storing only significant changes

## License

MIT
