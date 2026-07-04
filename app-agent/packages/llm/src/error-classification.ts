/**
 * Error classification and retry logic
 *
 * Inspired by @rnd/page-agent error handling patterns
 * Distinguishes retryable vs non-retryable errors with automatic retry logic
 */

/**
 * Error types for classification
 */
export const ErrorTypes = {
  // Retryable errors
  NETWORK_ERROR: 'network_error',
  RATE_LIMIT: 'rate_limit',
  SERVER_ERROR: 'server_error',
  TIMEOUT: 'timeout',
  NO_TOOL_CALL: 'no_tool_call',
  INVALID_TOOL_ARGS: 'invalid_tool_args',
  TOOL_EXECUTION_ERROR: 'tool_execution_error',
  INVALID_RESPONSE: 'invalid_response',
  INVALID_SCHEMA: 'invalid_schema',
  PARSE_ERROR: 'parse_error',
  UNKNOWN: 'unknown',

  // Non-retryable errors
  CONFIG_ERROR: 'config_error',
  AUTH_ERROR: 'auth_error',
  CONTEXT_LENGTH: 'context_length',
  CONTENT_FILTER: 'content_filter',
  ABORTED: 'aborted',
} as const;

export type ErrorType = (typeof ErrorTypes)[keyof typeof ErrorTypes];

/**
 * Retryable error types
 */
const RETRYABLE_TYPES: readonly ErrorType[] = [
  ErrorTypes.NETWORK_ERROR,
  ErrorTypes.RATE_LIMIT,
  ErrorTypes.SERVER_ERROR,
  ErrorTypes.TIMEOUT,
  ErrorTypes.NO_TOOL_CALL,
  ErrorTypes.INVALID_TOOL_ARGS,
  ErrorTypes.TOOL_EXECUTION_ERROR,
  ErrorTypes.INVALID_RESPONSE,
  ErrorTypes.INVALID_SCHEMA,
  ErrorTypes.PARSE_ERROR,
  ErrorTypes.UNKNOWN,
];

/**
 * Classified error with retry information
 */
export class ClassifiedError extends Error {
  type: ErrorType;
  retryable: boolean;
  statusCode?: number;
  originalError?: unknown;
  originalResponse?: unknown;

  constructor(
    type: ErrorType,
    message: string,
    statusCode?: number,
    originalError?: unknown,
    originalResponse?: unknown
  ) {
    super(message);
    this.name = 'ClassifiedError';
    this.type = type;
    this.retryable = RETRYABLE_TYPES.includes(type);
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.originalResponse = originalResponse;
  }

  /**
   * Create from standard error
   */
  static fromError(error: unknown, context?: string): ClassifiedError {
    if (error instanceof ClassifiedError) {
      return error;
    }

    if (error instanceof Error) {
      // Network errors
      if (error.name === 'AbortError') {
        return new ClassifiedError(ErrorTypes.ABORTED, error.message);
      }

      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return new ClassifiedError(ErrorTypes.TIMEOUT, error.message);
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new ClassifiedError(ErrorTypes.NETWORK_ERROR, error.message);
      }

      // Auth errors
      if (error.message.includes('401') || error.message.includes('auth') || error.message.includes('token')) {
        return new ClassifiedError(ErrorTypes.AUTH_ERROR, error.message);
      }

      // Rate limit
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return new ClassifiedError(ErrorTypes.RATE_LIMIT, error.message);
      }

      // Server errors
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        return new ClassifiedError(ErrorTypes.SERVER_ERROR, error.message);
      }

      // Context length
      if (error.message.includes('context') || error.message.includes('tokens')) {
        return new ClassifiedError(ErrorTypes.CONTEXT_LENGTH, error.message);
      }

      return new ClassifiedError(ErrorTypes.UNKNOWN, error.message);
    }

    // Unknown error type
    return new ClassifiedError(ErrorTypes.UNKNOWN, String(error));
  }

  /**
   * Create from HTTP response
   */
  static fromResponse(statusCode: number, responseText?: string): ClassifiedError {
    if (statusCode === 401) {
      return new ClassifiedError(ErrorTypes.AUTH_ERROR, 'Authentication failed', statusCode);
    }

    if (statusCode === 429) {
      return new ClassifiedError(ErrorTypes.RATE_LIMIT, 'Rate limit exceeded', statusCode);
    }

    if (statusCode >= 500) {
      return new ClassifiedError(ErrorTypes.SERVER_ERROR, `Server error: ${statusCode}`, statusCode);
    }

    if (statusCode >= 400) {
      return new ClassifiedError(ErrorTypes.CONFIG_ERROR, `Client error: ${statusCode}`, statusCode);
    }

    return new ClassifiedError(ErrorTypes.UNKNOWN, `Unexpected status code: ${statusCode}`, statusCode);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(attempt: number, baseDelay: number = 1000): number {
    if (!this.retryable) {
      return 0;
    }

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter

    // Special case for rate limit - use longer delays
    if (this.type === ErrorTypes.RATE_LIMIT) {
      return exponentialDelay * 2 + jitter;
    }

    return exponentialDelay + jitter;
  }

  /**
   * Get human-readable error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case ErrorTypes.NETWORK_ERROR:
        return 'Network error occurred. Please check your connection.';
      case ErrorTypes.RATE_LIMIT:
        return 'Rate limit exceeded. Please wait a moment.';
      case ErrorTypes.SERVER_ERROR:
        return 'Server error occurred. Please try again.';
      case ErrorTypes.TIMEOUT:
        return 'Request timed out. Please try again.';
      case ErrorTypes.AUTH_ERROR:
        return 'Authentication failed. Please check your credentials.';
      case ErrorTypes.CONTEXT_LENGTH:
        return 'Request too large. Please reduce the task complexity.';
      case ErrorTypes.CONTENT_FILTER:
        return 'Content was filtered by safety systems.';
      case ErrorTypes.ABORTED:
        return 'Operation was cancelled.';
      case ErrorTypes.INVALID_TOOL_ARGS:
        return 'Invalid action parameters. Please try again.';
      case ErrorTypes.TOOL_EXECUTION_ERROR:
        return 'Action execution failed. Please try again.';
      case ErrorTypes.PARSE_ERROR:
        return 'Failed to understand the response. Please try again.';
      default:
        return this.message;
    }
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  onRetry?: (attempt: number, error: ClassifiedError) => void;
}

/**
 * Execute with automatic retry for retryable errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: ClassifiedError | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = ClassifiedError.fromError(error);

      // Check if error is retryable
      if (!lastError.retryable) {
        throw lastError;
      }

      // Don't delay after last attempt
      if (attempt < config.maxAttempts - 1) {
        const delay = lastError.getRetryDelay(attempt, config.baseDelay);

        // Call retry callback
        if (config.onRetry) {
          config.onRetry(attempt + 1, lastError);
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Classify LLM response error
 */
export function classifyLLMError(error: unknown, rawResponse?: unknown): ClassifiedError {
  if (error instanceof ClassifiedError) {
    return error;
  }

  const classified = ClassifiedError.fromError(error);

  // Add raw response if available
  if (rawResponse) {
    classified.originalResponse = rawResponse;
  }

  return classified;
}