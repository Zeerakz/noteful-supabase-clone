
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { GentleToast } from '@/components/ui/gentle-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastDuration?: number;
  onRetry?: () => void;
}

export function useGentleErrorHandler() {
  const handleValidationError = useCallback((
    message: string, 
    suggestion?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    if (options.showToast) {
      toast({
        duration: options.toastDuration || 4000,
        // @ts-ignore - Custom toast component
        component: GentleToast,
        props: {
          type: 'warning',
          title: 'Please check your input',
          message,
          suggestion,
          onRetry: options.onRetry
        }
      });
    }
    
    return {
      type: 'validation' as const,
      message,
      suggestion
    };
  }, []);

  const handleSaveError = useCallback((
    message: string = 'Unable to save your changes',
    suggestion: string = 'Your work is safe. Please try saving again.',
    options: ErrorHandlerOptions = {}
  ) => {
    if (options.showToast !== false) {
      toast({
        duration: options.toastDuration || 6000,
        // @ts-ignore - Custom toast component  
        component: GentleToast,
        props: {
          type: 'error',
          title: 'Save unsuccessful',
          message,
          suggestion,
          onRetry: options.onRetry
        }
      });
    }
    
    return {
      type: 'save' as const,
      message,
      suggestion
    };
  }, []);

  const handleNetworkError = useCallback((
    message: string = 'Connection issue detected',
    suggestion: string = 'Please check your internet connection and try again.',
    options: ErrorHandlerOptions = {}
  ) => {
    if (options.showToast !== false) {
      toast({
        duration: options.toastDuration || 6000,
        // @ts-ignore - Custom toast component
        component: GentleToast,
        props: {
          type: 'error',
          title: 'Connection problem',
          message,
          suggestion,
          onRetry: options.onRetry
        }
      });
    }
    
    return {
      type: 'network' as const,
      message,
      suggestion
    };
  }, []);

  const handlePermissionError = useCallback((
    message: string = 'Permission required',
    suggestion: string = 'You may need additional permissions to perform this action.',
    options: ErrorHandlerOptions = {}
  ) => {
    if (options.showToast !== false) {
      toast({
        duration: options.toastDuration || 5000,
        // @ts-ignore - Custom toast component
        component: GentleToast,
        props: {
          type: 'warning',
          title: 'Access needed',
          message,
          suggestion
        }
      });
    }
    
    return {
      type: 'permission' as const,
      message,
      suggestion
    };
  }, []);

  const handleSuccess = useCallback((
    message: string,
    options: Omit<ErrorHandlerOptions, 'onRetry'> = {}
  ) => {
    if (options.showToast !== false) {
      toast({
        duration: options.toastDuration || 3000,
        // @ts-ignore - Custom toast component
        component: GentleToast,
        props: {
          type: 'success',
          message
        }
      });
    }
  }, []);

  return {
    handleValidationError,
    handleSaveError,
    handleNetworkError,
    handlePermissionError,
    handleSuccess
  };
}
