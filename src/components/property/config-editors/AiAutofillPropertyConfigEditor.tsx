
import React from 'react';
import { AiAutofillPropertyConfig } from '@/types/property/configs/aiAutofill';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';

interface AiAutofillPropertyConfigEditorProps {
  config: AiAutofillPropertyConfig;
  onConfigChange: (config: AiAutofillPropertyConfig) => void;
}

export function AiAutofillPropertyConfigEditor({ config, onConfigChange }: AiAutofillPropertyConfigEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Wand2 className="h-4 w-4" /> AI Prompt Configuration
        </CardTitle>
        <CardDescription>
          Write a prompt for the AI. It will be executed against the page's content to generate a value for this property.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">Prompt</Label>
          <Textarea
            id="ai-prompt"
            value={config.prompt || ''}
            onChange={(e) => onConfigChange({ ...config, prompt: e.target.value })}
            placeholder="e.g., Summarize the page content in one sentence."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
