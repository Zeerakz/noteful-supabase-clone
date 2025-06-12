
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { DatabaseField } from '@/types/database';

interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
  dateValue?: Date;
}

interface CalendarEntryCardProps {
  page: PageWithProperties;
  fields: DatabaseField[];
  selectedDateField: DatabaseField | null;
}

export function CalendarEntryCard({ page, fields, selectedDateField }: CalendarEntryCardProps) {
  // Show first few non-date fields (excluding the currently selected date field)
  const displayFields = fields
    .filter(field => field.type !== 'date' || field.id !== selectedDateField?.id)
    .slice(0, 3);

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm flex-1">{page.title || 'Untitled'}</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
      
      {displayFields.length > 0 && (
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
      )}
      
      {/* Show the date field value if it's not the primary one being used for calendar */}
      {page.dateValue && (
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          {format(page.dateValue, 'h:mm a')}
        </div>
      )}
    </div>
  );
}
