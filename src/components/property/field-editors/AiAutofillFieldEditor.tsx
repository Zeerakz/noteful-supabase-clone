
import React from 'react';
import { AiAutofillPropertyConfig } from '@/types/property/configs/aiAutofill';
import { useAiAutofill } from '@/hooks/useAiAutofill';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, RefreshCw } from 'lucide-react';
import { AiAutofillFieldDisplay } from '../field-displays/AiAutofillFieldDisplay';

interface AiAutofillFieldEditorProps {
  value: string | null;
  config: AiAutofillPropertyConfig;
  onChange: (value: string) => void;
  pageId?: string;
}

export function AiAutofillFieldEditor({ value, config, onChange, pageId }: AiAutofillFieldEditorProps) {
  if (!pageId) {
    return <div className="text-xs text-destructive p-1">Error: pageId is missing.</div>;
  }

  const { generate, isLoading } = useAiAutofill({
    pageId,
    prompt: config.prompt,
    onSuccess: onChange,
  });

  return (
    <div className="flex items-start gap-2 w-full">
      <div className="flex-grow">
        <AiAutofillFieldDisplay value={value} config={config} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={generate}
        disabled={isLoading}
        className="h-6 w-6 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : value ? (
          <RefreshCw className="h-4 w-4" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
