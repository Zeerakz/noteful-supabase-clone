
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseField } from '@/types/database';
import { EditableListTitle } from './EditableListTitle';
import { EditableListField } from './EditableListField';

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
}

interface ListCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  onFieldEdit: (pageId: string, fieldId: string, value: string) => void;
  onTitleEdit: (pageId: string, title: string) => void;
}

export function ListCard({ page, fields, onFieldEdit, onTitleEdit }: ListCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <EditableListTitle
            value={page.title}
            onSave={(title) => onTitleEdit(page.pageId, title)}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {field.name}
            </label>
            <EditableListField
              value={page.properties[field.id] || ''}
              fieldType={field.type}
              onSave={(value) => onFieldEdit(page.pageId, field.id, value)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
