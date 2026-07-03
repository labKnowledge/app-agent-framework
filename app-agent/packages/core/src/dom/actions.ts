/**
 * DOM Actions
 *
 * Execute actions on DOM elements
 */

import type { ElementInteraction, ScrollPosition } from './types';

/**
 * DOM Actions Class
 */
export class DOMActions {
  /**
   * Click an element
   */
  async clickElement(element: HTMLElement): Promise<ElementInteraction> {
    try {
      if (!this.isInteractable(element)) {
        return {
          success: false,
          result: 'Element is not interactable',
          error: new Error('Element is disabled or hidden'),
        };
      }

      // Scroll element into view
      this.ensureVisible(element);

      // Simulate full pointer event sequence
      await this.dispatchPointerEvent(element, 'pointerdown');
      await this.dispatchMouseEvent(element, 'mousedown');
      element.focus();
      await this.delay(10);

      // For inputs, focus them
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.focus();
      }

      // For buttons/links, trigger click
      await this.dispatchMouseEvent(element, 'mouseup');
      await this.dispatchPointerEvent(element, 'pointerup');
      await this.delay(10);
      await this.dispatchMouseEvent(element, 'click');

      // Trigger change event for forms
      const form = element.closest('form');
      if (form) {
        form.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return {
        success: true,
        result: `Clicked ${element.tagName.toLowerCase()}`,
      };
    } catch (error) {
      return {
        success: false,
        result: `Failed to click element`,
        error: error as Error,
      };
    }
  }

  /**
   * Input text into an element
   */
  async inputText(element: HTMLElement, text: string): Promise<ElementInteraction> {
    try {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
        return {
          success: false,
          result: 'Element is not an input',
          error: new Error('Element is not an input or textarea'),
        };
      }

      if (!this.isInteractable(element)) {
        return {
          success: false,
          result: 'Element is not interactable',
          error: new Error('Element is disabled or hidden'),
        };
      }

      this.ensureVisible(element);
      element.focus();

      // Clear existing value
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));

      // Type text character by character for realism
      for (const char of text) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(10);
      }

      // Trigger change event
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return {
        success: true,
        result: `Entered text into ${element.tagName.toLowerCase()}`,
      };
    } catch (error) {
      return {
        success: false,
        result: 'Failed to enter text',
        error: error as Error,
      };
    }
  }

  /**
   * Select dropdown option
   */
  async selectDropdown(element: HTMLElement, value: string): Promise<ElementInteraction> {
    try {
      if (!(element instanceof HTMLSelectElement)) {
        return {
          success: false,
          result: 'Element is not a select',
          error: new Error('Element is not a select element'),
        };
      }

      if (!this.isInteractable(element)) {
        return {
          success: false,
          result: 'Element is not interactable',
          error: new Error('Element is disabled or hidden'),
        };
      }

      this.ensureVisible(element);
      element.focus();

      // Find and select option
      const option = Array.from(element.options).find(
        (opt) => opt.value === value || opt.text === value
      );

      if (!option) {
        return {
          success: false,
          result: `Option not found: ${value}`,
          error: new Error(`Option not found: ${value}`),
        };
      }

      element.value = option.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return {
        success: true,
        result: `Selected option: ${option.text}`,
      };
    } catch (error) {
      return {
        success: false,
        result: 'Failed to select option',
        error: error as Error,
      };
    }
  }

  /**
   * Scroll page
   */
  async scroll(
    direction: 'up' | 'down' | 'left' | 'right',
    amount = 100
  ): Promise<ElementInteraction> {
    try {
      const currentX = window.scrollX || document.documentElement.scrollLeft;
      const currentY = window.scrollY || document.documentElement.scrollTop;

      let newX = currentX;
      let newY = currentY;

      switch (direction) {
        case 'up':
          newY = Math.max(0, currentY - amount);
          break;
        case 'down':
          newY = currentY + amount;
          break;
        case 'left':
          newX = Math.max(0, currentX - amount);
          break;
        case 'right':
          newX = currentX + amount;
          break;
      }

      window.scrollTo({ left: newX, top: newY, behavior: 'smooth' });

      return {
        success: true,
        result: `Scrolled ${direction} by ${amount}px`,
      };
    } catch (error) {
      return {
        success: false,
        result: 'Failed to scroll',
        error: error as Error,
      };
    }
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(element: HTMLElement): Promise<ElementInteraction> {
    try {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return {
        success: true,
        result: 'Scrolled element into view',
      };
    } catch (error) {
      return {
        success: false,
        result: 'Failed to scroll element into view',
        error: error as Error,
      };
    }
  }

  /**
   * Get scroll position
   */
  getScrollPosition(): ScrollPosition {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollWidth = document.documentElement.scrollWidth;
    const clientHeight = window.innerHeight;
    const clientWidth = window.innerWidth;

    return {
      x: scrollLeft,
      y: scrollTop,
      atTop: scrollTop === 0,
      atBottom: scrollTop + clientHeight >= scrollHeight,
      atLeft: scrollLeft === 0,
      atRight: scrollLeft + clientWidth >= scrollWidth,
    };
  }

  /**
   * Wait for specified time
   */
  async wait(duration: number): Promise<ElementInteraction> {
    await this.delay(duration);
    return {
      success: true,
      result: `Waited ${duration}ms`,
    };
  }

  /**
   * Check if element is interactable
   */
  private isInteractable(element: HTMLElement): boolean {
    if ('disabled' in element && (element as HTMLInputElement).disabled) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    return true;
  }

  /**
   * Ensure element is visible
   */
  private ensureVisible(element: HTMLElement): void {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Dispatch pointer event
   */
  private async dispatchPointerEvent(element: HTMLElement, type: string): Promise<void> {
    const event = new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 0,
      clientY: 0,
    });
    element.dispatchEvent(event);
  }

  /**
   * Dispatch mouse event
   */
  private async dispatchMouseEvent(element: HTMLElement, type: string): Promise<void> {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: 0,
      clientY: 0,
    });
    element.dispatchEvent(event);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
