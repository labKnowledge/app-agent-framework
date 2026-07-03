/**
 * SimulatorMask
 *
 * Visual overlay that blocks user interaction during automation
 * Shows animated cursor for visual feedback
 */

import type { SimulatorMaskConfig, CursorPosition } from './types';

/**
 * SimulatorMask Class
 */
export class SimulatorMask {
  private config: Required<SimulatorMaskConfig>;
  private element: HTMLDivElement | null = null;
  private cursorElement: HTMLDivElement | null = null;
  private visible = false;

  constructor(config: SimulatorMaskConfig = {}) {
    this.config = {
      color: config.color ?? 'rgba(0, 0, 0, 0.7)',
      opacity: config.opacity ?? 0.7,
      zIndex: config.zIndex ?? 999998,
      showCursor: config.showCursor ?? true,
    };
  }

  /**
   * Show the mask
   */
  show(): void {
    if (this.visible) {
      return;
    }

    this.element = this.createMask();
    this.cursorElement = this.createCursor();

    document.body.appendChild(this.element);
    if (this.cursorElement) {
      document.body.appendChild(this.cursorElement);
    }

    this.visible = true;
  }

  /**
   * Hide the mask
   */
  hide(): void {
    if (!this.visible) {
      return;
    }

    if (this.element) {
      document.body.removeChild(this.element);
      this.element = null;
    }

    if (this.cursorElement) {
      document.body.removeChild(this.cursorElement);
      this.cursorElement = null;
    }

    this.visible = false;
  }

  /**
   * Move cursor to position
   */
  moveCursor(position: CursorPosition): void {
    if (!this.cursorElement || !this.visible) {
      return;
    }

    this.cursorElement.style.left = `${position.x}px`;
    this.cursorElement.style.top = `${position.y}px`;
  }

  /**
   * Create mask element
   */
  private createMask(): HTMLDivElement {
    const mask = document.createElement('div');
    mask.className = 'app-agent-simulator-mask';

    Object.assign(mask.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: this.config.color,
      opacity: this.config.opacity.toString(),
      zIndex: this.config.zIndex.toString(),
      pointerEvents: 'auto',
      cursor: 'not-allowed',
    });

    return mask;
  }

  /**
   * Create cursor element
   */
  private createCursor(): HTMLDivElement | null {
    if (!this.config.showCursor) {
      return null;
    }

    const cursor = document.createElement('div');
    cursor.className = 'app-agent-simulator-cursor';

    cursor.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 3.21L20 12l-4.5 2.25-1.5 5.5-8.5-16.54z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5.5 3.21L11 14.5l4.5-4.25" fill="white"/>
      </svg>
    `;

    Object.assign(cursor.style, {
      position: 'fixed',
      width: '24px',
      height: '24px',
      zIndex: (this.config.zIndex + 1).toString(),
      pointerEvents: 'none',
      transition: 'all 0.3s ease-out',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
    });

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes app-agent-cursor-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      .app-agent-simulator-cursor svg {
        animation: app-agent-cursor-pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return cursor;
  }

  /**
   * Dispose of mask
   */
  dispose(): void {
    this.hide();
  }
}
