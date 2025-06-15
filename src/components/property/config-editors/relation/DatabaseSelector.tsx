
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Database } from '@/types/database';

interface DatabaseSelectorProps {
  databases: Database[];
  selectedDatabaseId: string;
  onSelect: (databaseId: string) => void;
  currentDatabaseId?: string;
  disabled?: boolean;
}

export function DatabaseSelector({
  databases,
  selectedDatabaseId,
  onSelect,
  currentDatabaseId,
  disabled = false,
}: DatabaseSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedDatabase = databases.find(db => db.id === selectedDatabaseId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || databases.length === 0}
        >
          {selectedDatabase ? selectedDatabase.name : 'Select a database...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search databases..." />
          <CommandList>
            <CommandEmpty>No database found.</CommandEmpty>
            <CommandGroup>
              {databases.map((database) => (
                <CommandItem
                  key={database.id}
                  value={database.name}
                  onSelect={() => {
                    onSelect(database.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedDatabaseId === database.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {database.name} {database.id === currentDatabaseId && '(This database)'}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
