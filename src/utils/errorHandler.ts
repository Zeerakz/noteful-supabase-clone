
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
  private maxErrors = 50;

  constructor() {
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.logError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'unhandledrejection',
        reason: event.reason
      });
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Uncaught error:', event.error);
      this.logError(event.error || new Error(event.message), {
        type: 'uncaught',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  logError(error: Error, additionalData?: Record<string, any>) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalData
    };

    // Add to local storage for persistence
    this.errors.push(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    try {
      localStorage.setItem('app_errors', JSON.stringify(this.errors));
    } catch (e) {
      console.warn('Could not save errors to localStorage:', e);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Logged');
      console.error('Error:', error);
      console.log('Additional Data:', additionalData);
      console.log('Error Details:', errorDetails);
      console.groupEnd();
    }
  }

  getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('app_errors');
    } catch (e) {
      console.warn('Could not clear errors from localStorage:', e);
    }
  }

  async reportError(error: Error, additionalData?: Record<string, any>) {
    this.logError(error, additionalData);
    
    // In a real app, you might send this to an error reporting service
    // For now, we'll just log it
    console.log('Error reported:', { error: error.message, additionalData });
  }
}

export const errorHandler = new GlobalErrorHandler();

// Helper function for try-catch blocks
export function withErrorHandler<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorHandler.logError(error, { context, args });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      errorHandler.logError(error as Error, { context, args });
      throw error;
    }
  }) as T;
}
