
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
    options: ErrorHandlerOptions = { showToast: true }
  ) => {
    if (options.showToast) {
      toast({
        duration: options.toastDuration || 4000,
        // @ts-ignore
        component: GentleToast,
        props: { type: 'warning', title: 'Validation Error', message, suggestion }
      });
    }
    return { type: 'validation' as const, message, suggestion };
  }, [toast]);

  const handleSaveError = useCallback((
    message: string = 'Unable to save your changes.',
    suggestion: string = 'Please check your connection and try again.',
    options: ErrorHandlerOptions = { showToast: true }
  ) => {
    if (options.showToast) {
      toast({
        duration: options.toastDuration || 6000,
        // @ts-ignore
        component: GentleToast,
        props: { type: 'error', title: 'Save Failed', message, suggestion, onRetry: options.onRetry }
      });
    }
    return { type: 'save' as const, message, suggestion };
  }, [toast]);

  const handleNetworkError = useCallback((
    message: string = 'A network error occurred.',
    suggestion: string = 'Please check your internet connection.',
    options: ErrorHandlerOptions = { showToast: true }
  ) => {
    if (options.showToast) {
      toast({
        duration: options.toastDuration || 8000,
        // @ts-ignore
        component: GentleToast,
        props: { type: 'error', title: 'Network Error', message, suggestion, onRetry: options.onRetry }
      });
    }
    return { type: 'network' as const, message, suggestion };
  }, [toast]);

  const handlePermissionError = useCallback((
    message: string = 'You do not have permission to perform this action.',
    options: ErrorHandlerOptions = { showToast: true }
  ) => {
    if (options.showToast) {
      toast({
        duration: options.toastDuration || 5000,
        // @ts-ignore
        component: GentleToast,
        props: { type: 'warning', title: 'Permission Denied', message }
      });
    }
    return { type: 'permission' as const, message };
  }, [toast]);

  const handleSuccess = useCallback((
    message: string,
    options: Omit<ErrorHandlerOptions, 'onRetry'> = { showToast: true }
  ) => {
    if (options.showToast) {
      toast({
        duration: options.toastDuration || 3000,
        // @ts-ignore
        component: GentleToast,
        props: { type: 'success', message }
      });
    }
  }, [toast]);

  return {
    handleValidationError,
    handleSaveError,
    handleNetworkError,
    handlePermissionError,
    handleSuccess
  };
}
