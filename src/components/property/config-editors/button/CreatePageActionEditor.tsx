
import React from 'react';
import { ButtonAction, CreatePageWithTemplateConfig } from '@/types/property/configs/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';

interface CreatePageActionEditorProps {
  action: ButtonAction;
  onActionChange: (updates: Partial<ButtonAction> | { config: any }) => void;
  workspaceId?: string;
}

export function CreatePageActionEditor({ action, onActionChange, workspaceId }: CreatePageActionEditorProps) {
  const templateConfig = action.config as CreatePageWithTemplateConfig;
  const { templates } = useTemplates(workspaceId);

  const selectedTemplate = templates.find((t) => t.id === templateConfig.templateId);
  const databaseId = selectedTemplate?.content?.database_id;
  const { fields: databaseFields } = useDatabaseFields(databaseId);

  const updateConfig = (updates: Partial<CreatePageWithTemplateConfig>) => {
    onActionChange({
      config: { ...templateConfig, ...updates },
    });
  };

  const addPrefilledProperty = () => {
    const newPrefilled = [...(templateConfig.prefilledProperties || []), { propertyId: '', value: '' }];
    updateConfig({ prefilledProperties: newPrefilled });
  };

  const updatePrefilledProperty = (index: number, updates: { propertyId?: string; value?: string }) => {
    const updatedPrefilled = [...(templateConfig.prefilledProperties || [])];
    updatedPrefilled[index] = { ...updatedPrefilled[index], ...updates };
    updateConfig({ prefilledProperties: updatedPrefilled });
  };

  const removePrefilledProperty = (index: number) => {
    const updatedPrefilled = (templateConfig.prefilledProperties || []).filter((_, i) => i !== index);
    updateConfig({ prefilledProperties: updatedPrefilled });
  };
  
  return (
    <div className="space-y-3">
      <div>
        <Label>Template</Label>
        <Select
          value={templateConfig.templateId || ''}
          onValueChange={(value) => {
            updateConfig({ templateId: value, prefilledProperties: [] });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template: any) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Page Name (optional)</Label>
        <Input
          value={templateConfig.pageName || ''}
          onChange={(e) => updateConfig({ pageName: e.target.value })}
          placeholder="Leave empty to use template name"
        />
      </div>
      <div className="space-y-2 pt-3 mt-3 border-t">
        <h5 className="text-sm font-medium">Prefill Properties</h5>
        {databaseId && databaseFields.length > 0 ? (
           <div className="space-y-2">
            {(templateConfig.prefilledProperties || []).map((prop, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Select
                  value={prop.propertyId}
                  onValueChange={(value) => updatePrefilledProperty(index, { propertyId: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {databaseFields.filter(f => !f.type.endsWith('_by') && !f.type.endsWith('_time') && f.type !== 'rollup' && f.type !== 'formula' && f.type !== 'button').map((field) => (
                      <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={prop.value}
                  onChange={(e) => updatePrefilledProperty(index, { value: e.target.value })}
                  placeholder="Value to set"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removePrefilledProperty(index)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addPrefilledProperty} className="mt-2">
              <Plus className="h-4 w-4 mr-1" /> Add property to prefill
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground px-1">
            {selectedTemplate ? (databaseId ? "No configurable properties found for this template's database." : 'This template is not associated with a database.') : 'Select a template to configure properties.'}
          </p>
        )}
      </div>
    </div>
  );
}
