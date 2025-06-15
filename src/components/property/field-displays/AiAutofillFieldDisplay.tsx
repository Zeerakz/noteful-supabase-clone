
import React from 'react';
import { AiAutofillPropertyConfig } from '@/types/property/configs/aiAutofill';
import { useAiAutofill } from '@/hooks/useAiAutofill';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, RefreshCw } from 'lucide-react';

interface AiAutofillFieldDisplayProps {
  value: string | null;
  config: AiAutofillPropertyConfig;
  onValueChange?: (value: string) => void;
  pageId?: string;
}

export function AiAutofillFieldDisplay({ value, config, onValueChange, pageId }: AiAutofillFieldDisplayProps) {
  const isEditable = !!(onValueChange && pageId);

  const { generate, isLoading } = useAiAutofill({
    pageId: pageId || '',
    prompt: config.prompt,
    onSuccess: onValueChange || (() => {}),
  });

  const displayContent = value ? (
    <div className="text-sm whitespace-pre-wrap">{value}</div>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

  if (!isEditable) {
    return displayContent;
  }
  
  if (!pageId) {
    return <div className="text-xs text-destructive p-1">Error: pageId is missing for AI Autofill.</div>;
  }

  return (
    <div className="flex items-start gap-2 w-full">
      <div className="flex-grow">{displayContent}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={generate}
        disabled={isLoading || !config.prompt}
        className="h-6 w-6 shrink-0"
        title={!config.prompt ? "Configure a prompt to enable AI autofill" : (value ? "Regenerate" : "Generate")}
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
