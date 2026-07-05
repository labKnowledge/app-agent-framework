/**
 * AppAgentPanel
 *
 * UI panel for displaying agent activity and history
 */

import type { PanelConfig, PanelState } from './types';
import type {
  AgentStatus,
  HistoricalEvent,
  AgentStepEvent,
  ObservationEvent,
  UserTakeoverEvent,
  RetryEvent,
  AgentErrorEvent
} from '@gakwaya/app-agent-entities';

/**
 * AppAgentPanel Class
 */
export class AppAgentPanel {
  private config: Required<PanelConfig>;
  private element: HTMLElement | null = null;
  private state: PanelState;
  private onTaskSubmit?: (task: string) => void;
  private eventCleanupCallbacks: Array<() => void> = [];
  private isDisposed = false;

  constructor(config: PanelConfig = {}) {
    this.config = {
      position: config.position ?? 'bottom-right',
      theme: config.theme ?? 'auto',
      defaultOpen: config.defaultOpen ?? true,
      className: config.className ?? '',
      zIndex: config.zIndex ?? 999999,
    };

    this.state = {
      open: this.config.defaultOpen,
      status: 'idle',
      activity: '',
      history: [],
      task: '',
    };

    // Apply theme
    if (this.config.theme === 'auto') {
      this.config.theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    this.initialize();
  }

  /**
   * Initialize panel
   */
  private initialize(): void {
    this.element = this.createPanel();
    this.attachStyles();
    document.body.appendChild(this.element);
    this.render();
  }

  /**
   * Set panel status
   */
  setStatus(status: AgentStatus): void {
    this.state.status = status;
    this.render();
  }

  /**
   * Set current activity
   */
  setActivity(activity: string): void {
    this.state.activity = activity;
    this.render();
  }

  /**
   * Add history item
   */
  addHistoryItem(item: HistoricalEvent): void {
    this.state.history.push(item);
    this.render();
  }

  /**
   * Set current task
   */
  setTask(task: string): void {
    this.state.task = task;
    this.render();
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.state.history = [];
    this.render();
  }

  /**
   * Toggle panel open/close
   */
  toggle(): void {
    this.state.open = !this.state.open;
    this.render();
  }

  /**
   * Open panel
   */
  open(): void {
    this.state.open = true;
    this.render();
  }

  /**
   * Close panel
   */
  close(): void {
    this.state.open = false;
    this.render();
  }

  /**
   * Set task submit callback
   */
  onSubmit(callback: (task: string) => void): void {
    this.onTaskSubmit = callback;
  }

  /**
   * Create panel element
   */
  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = `app-agent-panel app-agent-panel-${this.config.position} app-agent-theme-${this.config.theme} ${this.config.className}`;
    panel.style.zIndex = this.config.zIndex.toString();

    return panel;
  }

  /**
   * Attach styles
   */
  private attachStyles(): void {
    if (document.getElementById('app-agent-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'app-agent-styles';
    style.textContent = this.getStyles();
    document.head.appendChild(style);
  }

  /**
   * Render panel
   */
  private render(): void {
    if (!this.element) {
      return;
    }

    this.element.innerHTML = `
      <div class="app-agent-panel-container">
        <div class="app-agent-panel-header">
          <div class="app-agent-panel-title">
            <span class="app-agent-status-indicator app-agent-status-${this.state.status}"></span>
            <span>App Agent</span>
          </div>
          <button class="app-agent-panel-close" onclick="this.closest('.app-agent-panel').dispatchEvent(new CustomEvent('toggle'))">×</button>
        </div>

        ${this.state.open ? this.renderContent() : ''}

        <div class="app-agent-panel-footer">
          <div class="app-agent-activity">${this.state.activity}</div>
        </div>
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Render panel content
   */
  private renderContent(): string {
    return `
      <div class="app-agent-panel-content">
        <div class="app-agent-task-input">
          <input
            type="text"
            placeholder="What do you want to do?"
            value="${this.escapeHtml(this.state.task)}"
            class="app-agent-input"
          />
          <button class="app-agent-submit" disabled>${this.state.status === 'running' ? 'Running...' : 'Submit'}</button>
        </div>

        ${
          this.state.history.length > 0
            ? `
          <div class="app-agent-history">
            <div class="app-agent-history-header">History</div>
            ${this.state.history
              .slice(-10)
              .map(
                (item, _i) => `
              <div class="app-agent-history-item app-agent-history-${this.escapeHtml(item.type)}">
                <span class="app-agent-history-type">${this.escapeHtml(item.type.toUpperCase())}</span>
                <span class="app-agent-history-data">${this.formatHistoryData(item)}</span>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  /**
   * Format history data for display
   */
  private formatHistoryData(item: HistoricalEvent): string {
    // Handle different event types according to new structure
    switch (item.type) {
      case 'step':
        const stepEvent = item as AgentStepEvent;
        return `${stepEvent.action.name}: ${JSON.stringify(stepEvent.action.input)}`;

      case 'observation':
        const obsEvent = item as ObservationEvent;
        return obsEvent.content;

      case 'user_takeover':
        return 'User interrupted execution';

      case 'retry':
        const retryEvent = item as RetryEvent;
        return `Retry ${retryEvent.attempt}/${retryEvent.maxAttempts}: ${retryEvent.message}`;

      case 'error':
        const errorEvent = item as AgentErrorEvent;
        return `Error: ${errorEvent.message}`;

      default:
        // Fallback for unknown event types
        return JSON.stringify(item);
    }
  }

  /**
   * Escape HTML to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.element || this.isDisposed) {
      return;
    }

    // Clear previous listeners to prevent memory leaks
    this.eventCleanupCallbacks.forEach((cleanup) => cleanup());
    this.eventCleanupCallbacks = [];

    // Toggle event
    const toggleHandler = () => this.toggle();
    this.element.addEventListener('toggle', toggleHandler);
    this.eventCleanupCallbacks.push(() =>
      this.element?.removeEventListener('toggle', toggleHandler)
    );

    // Submit button
    const submitBtn = this.element.querySelector('.app-agent-submit');
    const input = this.element.querySelector('.app-agent-input') as HTMLInputElement;

    if (submitBtn && input && this.state.status !== 'running') {
      submitBtn.removeAttribute('disabled');

      const submitHandler = () => {
        const task = input.value.trim();
        if (task && this.onTaskSubmit && !this.isDisposed) {
          this.onTaskSubmit(task);
        }
      };
      submitBtn.addEventListener('click', submitHandler);
      this.eventCleanupCallbacks.push(() => submitBtn.removeEventListener('click', submitHandler));

      const keypressHandler = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && input.value.trim() && !this.isDisposed) {
          const task = input.value.trim();
          if (this.onTaskSubmit) {
            this.onTaskSubmit(task);
          }
        }
      };
      input.addEventListener('keypress', keypressHandler);
      this.eventCleanupCallbacks.push(() => input.removeEventListener('keypress', keypressHandler));
    }
  }

  /**
   * Get CSS styles
   */
  private getStyles(): string {
    return `
      .app-agent-panel {
        position: fixed;
        width: 400px;
        max-height: 600px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        overflow: hidden;
      }

      .app-agent-panel-bottom-right { bottom: 20px; right: 20px; }
      .app-agent-panel-bottom-left { bottom: 20px; left: 20px; }
      .app-agent-panel-top-right { top: 20px; right: 20px; }
      .app-agent-panel-top-left { top: 20px; left: 20px; }

      .app-agent-panel-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      /* Theme: Light */
      .app-agent-theme-light {
        background: white;
        border: 1px solid #e0e0e0;
        color: #333;
      }

      .app-agent-theme-light .app-agent-panel-header {
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
      }

      /* Theme: Dark */
      .app-agent-theme-dark {
        background: #1e1e1e;
        border: 1px solid #333;
        color: #ddd;
      }

      .app-agent-theme-dark .app-agent-panel-header {
        background: #2d2d2d;
        border-bottom: 1px solid #333;
      }

      .app-agent-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        font-weight: 600;
      }

      .app-agent-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .app-agent-status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
      }

      .app-agent-status-idle { background: #999; }
      .app-agent-status-running { background: #4caf50; animation: pulse 1s infinite; }
      .app-agent-status-waiting { background: #ff9800; }
      .app-agent-status-error { background: #f44336; }
      .app-agent-status-completed { background: #2196f3; }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .app-agent-panel-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .app-agent-panel-close:hover {
        background: rgba(0, 0, 0, 0.1);
      }

      .app-agent-panel-content {
        padding: 16px;
        overflow-y: auto;
        flex: 1;
      }

      .app-agent-task-input {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      .app-agent-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
      }

      .app-agent-submit {
        padding: 8px 16px;
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }

      .app-agent-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .app-agent-history {
        margin-top: 16px;
      }

      .app-agent-history-header {
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .app-agent-history-item {
        padding: 8px;
        margin-bottom: 4px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.05);
        font-size: 12px;
        display: flex;
        gap: 8px;
      }

      .app-agent-history-type {
        font-weight: 600;
        min-width: 80px;
      }

      .app-agent-history-data {
        flex: 1;
        word-break: break-word;
      }

      .app-agent-history-observation { color: #9c27b0; }
      .app-agent-history-reasoning { color: #2196f3; }
      .app-agent-history-action { color: #ff9800; }
      .app-agent-history-result { color: #4caf50; }

      .app-agent-panel-footer {
        padding: 8px 16px;
        border-top: 1px solid #e0e0e0;
        font-size: 12px;
      }

      .app-agent-theme-dark .app-agent-panel-footer {
        border-top-color: #333;
      }

      .app-agent-activity {
        font-style: italic;
        opacity: 0.7;
      }
    `;
  }

  /**
   * Dispose of panel
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;

    // Clean up all event listeners first to prevent memory leaks
    this.eventCleanupCallbacks.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn('[AppAgentPanel] Error during event listener cleanup:', error);
      }
    });
    this.eventCleanupCallbacks = [];

    // Clean up injected styles
    const styles = document.getElementById('app-agent-styles');
    if (styles && styles.parentNode) {
      styles.parentNode.removeChild(styles);
    }

    // Remove element from DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;

    // Clear callback reference
    this.onTaskSubmit = undefined;

    // Clear state
    this.state.history = [];
  }
}
