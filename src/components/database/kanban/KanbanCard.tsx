
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseField } from '@/types/database';
import { PageWithProperties } from './types';

interface KanbanCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  isDragging: boolean;
}

export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ page, fields, isDragging, ...props }, ref) => {
    // Show first few non-select fields
    const displayFields = fields.filter(
      field => !['select', 'multi_select', 'status'].includes(field.type)
    ).slice(0, 3);

    return (
      <Card
        ref={ref}
        className={`cursor-grab active:cursor-grabbing transition-shadow ${
          isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
        }`}
        {...props}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {page.title || 'Untitled'}
          </CardTitle>
        </CardHeader>
        {displayFields.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-1">
              {displayFields.map((field) => (
                <div key={field.id} className="text-xs">
                  <span className="text-muted-foreground">{field.name}:</span>{' '}
                  <span className="text-foreground">
                    {page.properties[field.id] || 'Empty'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
);

KanbanCard.displayName = 'KanbanCard';
