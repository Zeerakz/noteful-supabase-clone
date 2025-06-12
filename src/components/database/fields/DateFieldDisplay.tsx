
import React from 'react';
import { format } from 'date-fns';

interface DateFieldDisplayProps {
  value: string | null;
}

export function DateFieldDisplay({ value }: DateFieldDisplayProps) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  try {
    const date = new Date(value);
    
    // Check if it's a valid date
    if (isNaN(date.getTime())) {
      return <span className="text-muted-foreground">Invalid date</span>;
    }
    
    // Format as "Jun 22" for consistent display
    return <span className="text-sm">{format(date, "MMM d")}</span>;
  } catch (error) {
    return <span className="text-muted-foreground">Invalid date</span>;
  }
}
