
import React from 'react';
import { DatabaseField } from '@/types/database';
import { EnhancedFieldDisplay } from './EnhancedFieldDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PagePropertiesSectionProps {
  fields: DatabaseField[];
  properties: Record<string, string>;
  pageId: string;
  workspaceId: string;
  pageData?: any;
  userProfiles?: any[];
  onPropertyUpdate: (fieldId: string, value: string) => Promise<void>;
  isEditable?: boolean;
}

export function PagePropertiesSection({
  fields,
  properties,
  pageId,
  workspaceId,
  pageData,
  userProfiles,
  onPropertyUpdate,
  isEditable = true
}: PagePropertiesSectionProps) {
  if (fields.length === 0) {
    return null;
  }

  const handlePropertyChange = async (fieldId: string, value: string) => {
    try {
      await onPropertyUpdate(fieldId, value);
    } catch (error) {
      console.error('Failed to update property:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field) => {
            const value = properties[field.id] || '';
            
            return (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {field.name}
                </label>
                <div className="min-h-[2rem]">
                  <EnhancedFieldDisplay
                    field={field}
                    value={value}
                    pageId={pageId}
                    pageData={pageData}
                    userProfiles={userProfiles}
                    onValueChange={isEditable ? (newValue) => handlePropertyChange(field.id, newValue) : undefined}
                    showFieldControls={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
