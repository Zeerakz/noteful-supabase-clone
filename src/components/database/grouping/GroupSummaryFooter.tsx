
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DatabaseField } from '@/types/database';
import { GroupedItem } from '@/types/grouping';
import { getFieldSummary, formatSummaryValue, getAvailableMetrics } from '@/utils/summaryCalculations';

interface GroupSummaryFooterProps {
  items: GroupedItem[];
  fields: DatabaseField[];
  level: number;
}

export function GroupSummaryFooter({ items, fields, level }: GroupSummaryFooterProps) {
  // Only show summaries for number and date fields
  const summarizableFields = fields.filter(field => 
    field.type === 'number' || field.type === 'date'
  );

  if (summarizableFields.length === 0 || items.length === 0) {
    return null;
  }

  const getIndentLevel = (level: number) => {
    return level * 16; // 16px per level
  };

  return (
    <div 
      className="border-t bg-muted/20 p-3 text-sm"
      style={{ marginLeft: `${getIndentLevel(level + 1)}px` }}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="font-medium">Σ</span>
        <div className="flex flex-wrap gap-4">
          {summarizableFields.map(field => {
            const summary = getFieldSummary(items, field);
            if (!summary) return null;

            const metrics = getAvailableMetrics(field.type);
            const primaryMetric = field.type === 'number' ? 'sum' : 'earliest';
            const secondaryMetric = field.type === 'number' ? 'average' : 'latest';

            return (
              <div key={field.id} className="flex items-center gap-2">
                <span className="text-xs font-medium">{field.name}:</span>
                <div className="flex gap-1">
                  {metrics.slice(0, 2).map(metric => (
                    <Badge 
                      key={metric} 
                      variant="outline" 
                      className="text-xs px-1.5 py-0.5"
                    >
                      {metric === primaryMetric || metric === secondaryMetric ? (
                        <span className="font-medium">
                          {metric}: {formatSummaryValue(summary, metric)}
                        </span>
                      ) : (
                        <span>
                          {metric}: {formatSummaryValue(summary, metric)}
                        </span>
                      )}
                    </Badge>
                  ))}
                  
                  {summary.validCount < items.length && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {summary.validCount}/{items.length}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
