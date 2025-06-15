
export interface ErrorDetails {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

class GlobalErrorHandler {
  private errors: ErrorDetails[] = [];
  private maxErrors = 100;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.setupGlobalHandlers();
      this.isInitialized = true;
    }
  }

  private setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        context: 'global_error_handler',
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        context: 'global_error_handler',
        type: 'unhandled_rejection'
      });
    });
  }

  logError(error: Error, additionalData?: Record<string, any>) {
    console.error("Logged by GlobalErrorHandler:", error, additionalData);
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      additionalData
    };

    this.errors.unshift(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    // In a real app, you would send this to a service like Sentry, LogRocket, etc.
  }

  getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }
}

export const errorHandler = new GlobalErrorHandler();

export function withErrorHandler<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): (...args: Parameters<T>) => ReturnType<T> | void {
  return (...args: Parameters<T>): ReturnType<T> | void => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorHandler.logError(error, { context, args });
        }) as ReturnType<T>;
      }
      return result;
    } catch (error) {
      errorHandler.logError(error as Error, { context, args });
    }
  };
}
