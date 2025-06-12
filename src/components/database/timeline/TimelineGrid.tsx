
import React from 'react';
import { format, addDays, addWeeks, addMonths, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { TimelineViewMode, TimelineItem } from './types';

interface TimelineGridProps {
  viewMode: TimelineViewMode;
  startDate: Date;
  endDate: Date;
  items: TimelineItem[];
  children: React.ReactNode;
}

export function TimelineGrid({ viewMode, startDate, endDate, children }: TimelineGridProps) {
  const getTimeUnits = () => {
    const units: Date[] = [];
    let current = viewMode === 'day' ? startOfDay(startDate) :
                   viewMode === 'week' ? startOfWeek(startDate) :
                   startOfMonth(startDate);
    
    const end = viewMode === 'day' ? startOfDay(endDate) :
                viewMode === 'week' ? startOfWeek(endDate) :
                startOfMonth(endDate);

    while (current <= end) {
      units.push(new Date(current));
      current = viewMode === 'day' ? addDays(current, 1) :
                viewMode === 'week' ? addWeeks(current, 1) :
                addMonths(current, 1);
    }

    return units;
  };

  const timeUnits = getTimeUnits();
  const unitWidth = 200; // pixels per unit

  const formatHeader = (date: Date) => {
    switch (viewMode) {
      case 'day':
        return format(date, 'MMM d');
      case 'week':
        return format(date, 'MMM d');
      case 'month':
        return format(date, 'MMM yyyy');
      default:
        return format(date, 'MMM d');
    }
  };

  return (
    <div className="relative">
      {/* Timeline Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex" style={{ minWidth: timeUnits.length * unitWidth }}>
          {timeUnits.map((date, index) => (
            <div
              key={index}
              className="border-r border-border p-3 text-sm font-medium text-center"
              style={{ width: unitWidth }}
            >
              {formatHeader(date)}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative" style={{ minWidth: timeUnits.length * unitWidth }}>
        {/* Grid Lines */}
        <div className="absolute inset-0 flex">
          {timeUnits.map((_, index) => (
            <div
              key={index}
              className="border-r border-border/30"
              style={{ width: unitWidth }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative min-h-[400px] p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
