
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Calendar, Clock } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { TimelineViewMode } from './types';

interface TimelineViewHeaderProps {
  dateFields: DatabaseField[];
  selectedStartField: DatabaseField | null;
  selectedEndField: DatabaseField | null;
  viewMode: TimelineViewMode;
  onStartFieldChange: (field: DatabaseField | null) => void;
  onEndFieldChange: (field: DatabaseField | null) => void;
  onViewModeChange: (mode: TimelineViewMode) => void;
}

export function TimelineViewHeader({
  dateFields,
  selectedStartField,
  selectedEndField,
  viewMode,
  onStartFieldChange,
  onEndFieldChange,
  onViewModeChange
}: TimelineViewHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Timeline View</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('day')}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Day
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('week')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('month')}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            Month
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Start Date:</span>
          <Select
            value={selectedStartField?.id || ''}
            onValueChange={(value) => {
              const field = dateFields.find(f => f.id === value);
              onStartFieldChange(field || null);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select start date field" />
            </SelectTrigger>
            <SelectContent>
              {dateFields.map(field => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">End Date (optional):</span>
          <Select
            value={selectedEndField?.id || ''}
            onValueChange={(value) => {
              const field = dateFields.find(f => f.id === value);
              onEndFieldChange(field || null);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select end date field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {dateFields.map(field => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
