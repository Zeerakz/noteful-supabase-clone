
import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar } from 'lucide-react';

interface DateFieldDisplayProps {
  value: string | null;
  showIcon?: boolean;
}

export function DateFieldDisplay({ value, showIcon = false }: DateFieldDisplayProps) {
  if (!value) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        {showIcon && <Calendar className="h-3 w-3" />}
        <span>—</span>
      </div>
    );
  }

  try {
    let date: Date;
    
    // Try different date parsing methods
    if (value.includes('T') || value.includes('Z')) {
      // ISO format
      date = parseISO(value);
    } else {
      // Simple date format
      date = new Date(value);
    }
    
    // Check if it's a valid date
    if (!isValid(date)) {
      console.warn('Invalid date value:', value);
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          {showIcon && <Calendar className="h-3 w-3" />}
          <span className="text-xs">Invalid date</span>
        </div>
      );
    }
    
    // Format as "Jun 22, 2024" for better visibility
    const formattedDate = format(date, "MMM d, yyyy");
    
    return (
      <div className="flex items-center gap-2">
        {showIcon && <Calendar className="h-3 w-3 text-muted-foreground" />}
        <span className="text-sm font-medium">{formattedDate}</span>
      </div>
    );
  } catch (error) {
    console.error('Error formatting date:', error, 'Value:', value);
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        {showIcon && <Calendar className="h-3 w-3" />}
        <span className="text-xs">Date error</span>
      </div>
    );
  }
}
