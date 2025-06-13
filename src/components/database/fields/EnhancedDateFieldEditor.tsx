
import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, isValid, addDays, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePropertyConfig } from '@/types/property/configs/date';

interface EnhancedDateFieldEditorProps {
  value: string | null;
  onChange: (value: string) => void;
  config?: DatePropertyConfig;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function EnhancedDateFieldEditor({ value, onChange, config = {} }: EnhancedDateFieldEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [naturalInput, setNaturalInput] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(config.timezone || 'local');
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse existing value
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (!value || value.trim() === '') return { from: undefined, to: undefined };
    
    if (config.enableRange && value.includes('|')) {
      const [fromStr, toStr] = value.split('|');
      return {
        from: fromStr ? new Date(fromStr) : undefined,
        to: toStr ? new Date(toStr) : undefined
      };
    }
    
    const singleDate = new Date(value);
    return isValid(singleDate) ? { from: singleDate, to: undefined } : { from: undefined, to: undefined };
  });

  // Natural language processing
  const parseNaturalLanguage = (input: string): Date | DateRange | null => {
    const today = new Date();
    const lowerInput = input.toLowerCase().trim();

    // Simple patterns for demonstration
    if (lowerInput === 'today') return today;
    if (lowerInput === 'tomorrow') return addDays(today, 1);
    if (lowerInput === 'yesterday') return addDays(today, -1);
    if (lowerInput.includes('next monday')) {
      const nextMonday = addDays(startOfWeek(today), 8);
      return nextMonday;
    }
    if (lowerInput.includes('this week')) {
      return {
        from: startOfWeek(today),
        to: endOfWeek(today)
      } as DateRange;
    }
    if (lowerInput.includes('next week')) {
      const nextWeekStart = addWeeks(startOfWeek(today), 1);
      return {
        from: nextWeekStart,
        to: endOfWeek(nextWeekStart)
      } as DateRange;
    }

    // Try to parse as regular date
    const parsed = new Date(input);
    return isValid(parsed) ? parsed : null;
  };

  const handleNaturalInputSubmit = () => {
    if (!naturalInput) return;

    const parsed = parseNaturalLanguage(naturalInput);
    if (parsed) {
      if (parsed instanceof Date) {
        setDateRange({ from: parsed, to: undefined });
        updateValue({ from: parsed, to: undefined });
      } else {
        setDateRange(parsed);
        updateValue(parsed);
      }
      setNaturalInput('');
      setIsOpen(false);
    }
  };

  const updateValue = (range: DateRange) => {
    if (config.enableRange && range.from && range.to) {
      onChange(`${range.from.toISOString()}|${range.to.toISOString()}`);
    } else if (range.from) {
      onChange(range.from.toISOString());
    } else {
      onChange('');
    }
  };

  const handleSingleDateSelect = (selected: Date | undefined) => {
    if (!selected) {
      setDateRange({ from: undefined, to: undefined });
      onChange('');
      return;
    }

    const newRange = { from: selected, to: undefined };
    setDateRange(newRange);
    updateValue(newRange);
  };

  const handleRangeDateSelect = (selected: DateRange | undefined) => {
    if (!selected) {
      setDateRange({ from: undefined, to: undefined });
      onChange('');
      return;
    }

    setDateRange(selected);
    updateValue(selected);
  };

  const formatDisplayText = (): string => {
    if (!dateRange.from) return config.enableRange ? "Pick date range" : "Pick a date";
    
    if (config.enableRange && dateRange.to) {
      return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`;
    }
    
    return format(dateRange.from, config.includeTime ? "MMM d, yyyy 'at' h:mm a" : "MMM d, yyyy");
  };

  const timezones = [
    { value: 'local', label: 'Local timezone' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
  ];

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-transparent border-none shadow-none hover:bg-muted/50 focus-visible:ring-1",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{formatDisplayText()}</span>
            {config.includeTime && <Clock className="ml-auto h-3 w-3" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-md" align="start">
          <div className="p-3 space-y-3">
            {config.enableNaturalLanguage && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Try 'next Monday', 'tomorrow', 'this week'..."
                    value={naturalInput}
                    onChange={(e) => setNaturalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNaturalInputSubmit();
                      }
                    }}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleNaturalInputSubmit}>
                    Parse
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['today', 'tomorrow', 'next Monday', 'this week'].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        setNaturalInput(suggestion);
                        const parsed = parseNaturalLanguage(suggestion);
                        if (parsed) {
                          if (parsed instanceof Date) {
                            setDateRange({ from: parsed, to: undefined });
                            updateValue({ from: parsed, to: undefined });
                          } else {
                            setDateRange(parsed);
                            updateValue(parsed);
                          }
                          setIsOpen(false);
                        }
                      }}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {config.timezone && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conditionally render Calendar based on mode */}
            {config.enableRange ? (
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleRangeDateSelect}
                initialFocus
                className="rounded-md border-0 pointer-events-auto"
              />
            ) : (
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={handleSingleDateSelect}
                initialFocus
                className="rounded-md border-0 pointer-events-auto"
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
