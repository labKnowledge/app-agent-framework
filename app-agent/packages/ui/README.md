# @app-agent/ui

UI components for App-Agent - panel and visual feedback during automation.

## Features

- ✅ **Agent Panel**: Display agent activity and history
- ✅ **SimulatorMask**: Visual overlay during automation
- ✅ **Animated Cursor**: Professional cursor animation
- ✅ **Theme Support**: Light and dark themes
- ✅ **Position Control**: Flexible panel positioning
- ✅ **Event System**: User interaction callbacks

## Usage

```typescript
import { AppAgentPanel, SimulatorMask } from '@app-agent/ui';

// Create panel
const panel = new AppAgentPanel({
  position: 'bottom-right',
  theme: 'auto',
  defaultOpen: true,
});

// Update panel
panel.setStatus('running');
panel.setActivity('Thinking...');
panel.addHistoryItem({
  type: 'observation',
  timestamp: Date.now(),
  data: { url: 'https://example.com' },
});

// Create mask
const mask = new SimulatorMask({
  color: 'rgba(0, 0, 0, 0.7)',
  showCursor: true,
});

// Show/hide mask
mask.show();
mask.moveCursor({ x: 100, y: 200 });
mask.hide();

// Clean up
panel.dispose();
mask.dispose();
```

## API

### AppAgentPanel

#### Constructor

```typescript
new AppAgentPanel(config?: PanelConfig)
```

**PanelConfig:**
- `position`: Panel position (default: 'bottom-right')
- `theme`: Theme - 'light', 'dark', or 'auto' (default: 'auto')
- `defaultOpen`: Open by default (default: true)
- `className`: Custom CSS class
- `zIndex`: Custom z-index (default: 999999)

#### Methods

**setStatus(status: AgentStatus): void**
- Update agent status

**setActivity(activity: string): void**
- Update current activity text

**addHistoryItem(item: HistoricalEvent): void**
- Add item to history display

**setTask(task: string): void**
- Set current task

**clearHistory(): void**
- Clear all history

**toggle(): void**
- Toggle panel open/close

**open(): void**
- Open panel

**close(): void**
- Close panel

**onSubmit(callback: (task: string) => void): void**
- Set callback for task submission

**dispose(): void**
- Clean up panel resources

### SimulatorMask

#### Constructor

```typescript
new SimulatorMask(config?: SimulatorMaskConfig)
```

**SimulatorMaskConfig:**
- `color`: Overlay color (default: 'rgba(0, 0, 0, 0.7)')
- `opacity`: Overlay opacity (default: 0.7)
- `zIndex`: Custom z-index (default: 999998)
- `showCursor`: Show animated cursor (default: true)

#### Methods

**show(): void**
- Show the overlay

**hide(): void**
- Hide the overlay

**moveCursor(position: CursorPosition): void**
- Move cursor to position

**dispose(): void**
- Clean up mask resources

## License

MIT
