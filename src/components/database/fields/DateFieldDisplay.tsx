
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
    return <span>{format(date, "MMM d, yyyy")}</span>;
  } catch (error) {
    return <span className="text-muted-foreground">Invalid date</span>;
  }
}
