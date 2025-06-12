
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Settings } from 'lucide-react';
import { DatabaseField, PageProperty } from '@/types/database';
import { FieldEditor } from './FieldEditor';
import { FieldDisplay } from './FieldDisplay';
import { Badge } from '@/components/ui/badge';

interface PagePropertiesSectionProps {
  fields: DatabaseField[];
  properties: PageProperty[];
  pageId: string;
  workspaceId: string;
  onPropertyUpdate: (fieldId: string, value: string) => Promise<void>;
  isEditable?: boolean;
}

export function PagePropertiesSection({
  fields,
  properties,
  pageId,
  workspaceId,
  onPropertyUpdate,
  isEditable = true
}: PagePropertiesSectionProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Create a map of field_id -> property value for quick lookup
  const propertyMap = properties.reduce((acc, prop) => {
    acc[prop.field_id] = prop.value || '';
    return acc;
  }, {} as Record<string, string>);

  // Filter fields based on visibility settings
  const visibleFields = fields.filter(field => {
    const value = propertyMap[field.id] || '';
    const hasValue = value && value.trim() !== '';
    
    switch (field.visibility_setting) {
      case 'always_show':
        return true;
      case 'always_hide':
        return false;
      case 'show_when_not_empty':
      default:
        return hasValue;
    }
  });

  const handlePropertyChange = async (fieldId: string, value: string) => {
    try {
      await onPropertyUpdate(fieldId, value);
      setEditingFieldId(null);
    } catch (error) {
      console.error('Failed to update property:', error);
    }
  };

  // Show section only if there are visible fields or if we're in edit mode and there are always_show fields
  const alwaysShowFields = fields.filter(f => f.visibility_setting === 'always_show');
  const shouldShowSection = visibleFields.length > 0 || (isEditable && alwaysShowFields.length > 0);

  if (!shouldShowSection) {
    return null;
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Properties</h3>
        {isEditable && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {visibleFields.length} visible
            </Badge>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Always show fields (even when empty in edit mode) */}
        {fields
          .filter(field => field.visibility_setting === 'always_show')
          .map(field => {
            const value = propertyMap[field.id] || '';
            const isEditing = editingFieldId === field.id;

            return (
              <div key={field.id} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {field.name}
                </div>
                {isEditing && isEditable ? (
                  <FieldEditor
                    field={field}
                    value={value}
                    onChange={(newValue) => handlePropertyChange(field.id, newValue)}
                    workspaceId={workspaceId}
                    pageId={pageId}
                  />
                ) : (
                  <div
                    className="min-h-[32px] p-2 border rounded cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => isEditable && setEditingFieldId(field.id)}
                  >
                    <FieldDisplay
                      field={field}
                      value={value || null}
                      pageId={pageId}
                    />
                  </div>
                )}
              </div>
            );
          })}

        {/* Fields that show when not empty */}
        {fields
          .filter(field => 
            field.visibility_setting === 'show_when_not_empty' && 
            propertyMap[field.id] && 
            propertyMap[field.id].trim() !== ''
          )
          .map(field => {
            const value = propertyMap[field.id] || '';
            const isEditing = editingFieldId === field.id;

            return (
              <div key={field.id} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {field.name}
                </div>
                {isEditing && isEditable ? (
                  <FieldEditor
                    field={field}
                    value={value}
                    onChange={(newValue) => handlePropertyChange(field.id, newValue)}
                    workspaceId={workspaceId}
                    pageId={pageId}
                  />
                ) : (
                  <div
                    className="min-h-[32px] p-2 border rounded cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => isEditable && setEditingFieldId(field.id)}
                  >
                    <FieldDisplay
                      field={field}
                      value={value || null}
                      pageId={pageId}
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {isEditable && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <Plus className="h-3 w-3" />
          Add property
        </Button>
      )}
    </Card>
  );
}
