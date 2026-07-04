/**
 * Observation System for Edge Cases and Warnings
 *
 * Proactive user feedback about edge cases and system state
 * Inspired by @rnd/page-agent observation patterns
 */

import type { ObservationEvent, HistoricalEvent } from '@gakwaya/app-agent-entities';

/**
 * Observation types
 */
export type ObservationType =
  | 'step_limit_warning'
  | 'wait_time_warning'
  | 'page_navigation_detected'
  | 'captcha_detected'
  | 'error_recovery_attempt'
  | 'resource_cleanup'
  | 'context_limit_warning'
  | 'retry_attempt'
  | 'tool_execution_slow'
  | 'unusual_behavior';

/**
 * Observation configuration
 */
export interface ObservationConfig {
  maxSteps: number;
  stepWarningThreshold: number; // percentage (e.g., 0.8 for 80%)
  maxWaitTime: number; // milliseconds
  waitWarningThreshold: number; // percentage
  contextWarningThreshold: number; // percentage
  slowToolThreshold: number; // milliseconds
}

/**
 * Observation system state
 */
interface ObservationState {
  totalWaitTime: number;
  slowTools: string[];
  retryCount: number;
  stepCount: number;
}

/**
 * Observation system for proactive feedback
 */
export class ObservationSystem {
  private config: ObservationConfig;
  private state: ObservationState;
  private observations: HistoricalEvent[] = [];

  constructor(config: Partial<ObservationConfig> = {}) {
    this.config = {
      maxSteps: config.maxSteps ?? 40,
      stepWarningThreshold: config.stepWarningThreshold ?? 0.8,
      maxWaitTime: config.maxWaitTime ?? 60000, // 1 minute
      waitWarningThreshold: config.waitWarningThreshold ?? 0.7,
      contextWarningThreshold: config.contextWarningThreshold ?? 0.9,
      slowToolThreshold: config.slowToolThreshold ?? 5000, // 5 seconds
    };

    this.state = {
      totalWaitTime: 0,
      slowTools: [],
      retryCount: 0,
      stepCount: 0,
    };
  }

  /**
   * Check step limit and emit warning if approaching
   */
  checkStepLimit(step: number): ObservationEvent | null {
    this.state.stepCount = step;

    const warningThreshold = Math.floor(this.config.maxSteps * this.config.stepWarningThreshold);
    const criticalThreshold = Math.floor(this.config.maxSteps * 0.9);

    if (step === criticalThreshold) {
      return this.createObservation('step_limit_warning', `Critical: Only ${this.config.maxSteps - step} steps remaining!`);
    }

    if (step === warningThreshold) {
      return this.createObservation('step_limit_warning', `Warning: Approaching maximum step limit (${this.config.maxSteps - step} steps remaining)`);
    }

    if (step >= this.config.maxSteps) {
      return this.createObservation('step_limit_warning', `Maximum steps reached (${this.config.maxSteps}). Task completion not verified.`);
    }

    return null;
  }

  /**
   * Check wait time and emit warning if excessive
   */
  checkWaitTime(waitTime: number): ObservationEvent | null {
    this.state.totalWaitTime += waitTime;

    const warningThreshold = this.config.maxWaitTime * this.config.waitWarningThreshold;

    if (this.state.totalWaitTime > this.config.maxWaitTime) {
      return this.createObservation('wait_time_warning', `Total wait time exceeded ${this.config.maxWaitTime}ms. Consider task complexity.`);
    }

    if (this.state.totalWaitTime > warningThreshold) {
      return this.createObservation('wait_time_warning', `Accumulated wait time: ${this.state.totalWaitTime}ms`);
    }

    return null;
  }

  /**
   * Detect page navigation changes
   */
  detectPageNavigation(currentURL: string, previousURL: string): ObservationEvent | null {
    if (!previousURL) return null;

    // Check if URL changed
    if (currentURL !== previousURL) {
      return this.createObservation('page_navigation_detected', `Navigated from ${previousURL} to ${currentURL}`);
    }

    return null;
  }

  /**
   * Detect potential captcha presence
   */
  detectCaptcha(domContent: string): ObservationEvent | null {
    const captchaKeywords = ['captcha', 'recaptcha', 'human verification', 'prove you\'re human', 'robot check'];

    const content = domContent.toLowerCase();
    for (const keyword of captchaKeywords) {
      if (content.includes(keyword)) {
        return this.createObservation('captcha_detected', 'CAPTCHA or human verification detected. Task may require manual intervention.');
      }
    }

    return null;
  }

  /**
   * Track slow tool execution
   */
  trackSlowTool(toolName: string, duration: number): ObservationEvent | null {
    if (duration > this.config.slowToolThreshold) {
      if (!this.state.slowTools.includes(toolName)) {
        this.state.slowTools.push(toolName);
      }
      return this.createObservation('tool_execution_slow', `Tool '${toolName}' took ${duration}ms to execute (threshold: ${this.config.slowToolThreshold}ms)`);
    }

    return null;
  }

  /**
   * Track retry attempts
   */
  trackRetry(attempt: number, maxAttempts: number, reason: string): ObservationEvent | null {
    this.state.retryCount++;

    if (attempt === maxAttempts - 1) {
      return this.createObservation('retry_attempt', `Final retry attempt (${attempt}/${maxAttempts}) for: ${reason}`);
    }

    if (attempt >= Math.floor(maxAttempts * 0.7)) {
      return this.createObservation('retry_attempt', `Retrying operation (${attempt}/${maxAttempts}): ${reason}`);
    }

    return null;
  }

  /**
   * Detect unusual behavior patterns
   */
  detectUnusualBehavior(
    consecutiveFailures: number,
    repeatedActions: string[],
    stuckState: boolean
  ): ObservationEvent | null {
    if (consecutiveFailures >= 3) {
      return this.createObservation('unusual_behavior', `Multiple consecutive failures detected (${consecutiveFailures}). Consider alternative approach.`);
    }

    if (stuckState) {
      return this.createObservation('unusual_behavior', 'Agent appears stuck in loop. Task may require user intervention.');
    }

    if (repeatedActions.length >= 5) {
      const actionCounts = new Map<string, number>();
      for (const action of repeatedActions) {
        actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
      }

      for (const [action, count] of actionCounts) {
        if (count >= 3) {
          return this.createObservation('unusual_behavior', `Repeating same action '${action}' ${count} times. Strategy may need adjustment.`);
        }
      }
    }

    return null;
  }

  /**
   * Get all observations
   */
  getObservations(): HistoricalEvent[] {
    return [...this.observations];
  }

  /**
   * Get observations by type
   */
  getObservationsByType(type: ObservationType): HistoricalEvent[] {
    return this.observations.filter((obs) => obs.type === 'observation' && (obs as ObservationEvent).content.startsWith(`[${type}]`));
  }

  /**
   * Clear observations
   */
  clear(): void {
    this.observations = [];
    this.state = {
      totalWaitTime: 0,
      slowTools: [],
      retryCount: 0,
      stepCount: 0,
    };
  }

  /**
   * Get current state
   */
  getState(): ObservationState {
    return { ...this.state };
  }

  /**
   * Create an observation event
   */
  private createObservation(type: ObservationType, content: string): ObservationEvent {
    const observation: ObservationEvent = {
      type: 'observation',
      timestamp: Date.now(),
      content: `[${type.toUpperCase()}] ${content}`,
      severity: this.getSeverity(type),
    };

    this.observations.push(observation);
    return observation;
  }

  /**
   * Determine observation severity
   */
  private getSeverity(type: ObservationType): 'info' | 'warning' | 'error' {
    switch (type) {
      case 'step_limit_warning':
      case 'wait_time_warning':
      case 'tool_execution_slow':
        return 'warning';
      case 'captcha_detected':
      case 'unusual_behavior':
        return 'error';
      default:
        return 'info';
    }
  }
}

/**
 * Helper function to add observations from agent state
 */
export function checkAndAddObservations(
  observationSystem: ObservationSystem,
  step: number,
  currentURL: string,
  previousURL: string,
  domContent: string,
  consecutiveFailures: number,
  addObservation: (event: ObservationEvent) => void
): void {
  // Check step limit
  const stepWarning = observationSystem.checkStepLimit(step);
  if (stepWarning) addObservation(stepWarning);

  // Detect page navigation
  const navWarning = observationSystem.detectPageNavigation(currentURL, previousURL);
  if (navWarning) addObservation(navWarning);

  // Detect captcha
  const captchaWarning = observationSystem.detectCaptcha(domContent);
  if (captchaWarning) addObservation(captchaWarning);

  // Detect unusual behavior
  const behaviorWarning = observationSystem.detectUnusualBehavior(consecutiveFailures, [], false);
  if (behaviorWarning) addObservation(behaviorWarning);
}