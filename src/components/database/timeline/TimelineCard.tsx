
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { TimelineItem } from './types';
import { DatabaseField } from '@/types/database';

interface TimelineCardProps {
  item: TimelineItem;
  fields: DatabaseField[];
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export const TimelineCard = React.forwardRef<HTMLDivElement, TimelineCardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ item, fields, isDragging, style, ...props }, ref) => {
    const displayFields = fields.filter(
      field => field.type !== 'date' && field.type !== 'formula' && field.type !== 'rollup'
    ).slice(0, 3);

    const getDuration = () => {
      if (!item.endDate) return null;
      const diffTime = item.endDate.getTime() - item.startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const duration = getDuration();

    return (
      <Card
        ref={ref}
        className={`cursor-grab active:cursor-grabbing transition-shadow min-w-[200px] ${
          isDragging ? 'shadow-lg rotate-1 opacity-90' : 'hover:shadow-md'
        }`}
        style={style}
        {...props}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {item.title || 'Untitled'}
            </CardTitle>
            {duration && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                {duration}d
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(item.startDate, 'MMM d, yyyy')}
            {item.endDate && ` - ${format(item.endDate, 'MMM d, yyyy')}`}
          </div>
        </CardHeader>
        {displayFields.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-1">
              {displayFields.map((field) => (
                <div key={field.id} className="text-xs">
                  <span className="text-muted-foreground">{field.name}:</span>{' '}
                  <span className="text-foreground">
                    {item.properties[field.id] || 'Empty'}
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

TimelineCard.displayName = 'TimelineCard';
