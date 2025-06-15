
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface UseAiAutofillProps {
  pageId: string;
  prompt: string;
  onSuccess: (result: string) => void;
}

export function useAiAutofill({ pageId, prompt, onSuccess }: UseAiAutofillProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = useCallback(async () => {
    if (!prompt) {
      toast({
        title: 'Missing Prompt',
        description: 'Please configure a prompt for the AI autofill property.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-custom-autofill', {
        body: { pageId, prompt },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      onSuccess(data.result);

    } catch (e: any) {
      const errorMessage = e.message || 'Failed to generate value.';
      setError(errorMessage);
      toast({
        title: 'AI Autofill Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageId, prompt, onSuccess, toast]);

  return { generate, isLoading, error };
}
