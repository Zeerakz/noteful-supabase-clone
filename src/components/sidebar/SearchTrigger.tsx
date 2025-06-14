
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';

export function SearchTrigger() {
  const { openSearch } = useGlobalSearch();

  return (
    <Button
      variant="ghost"
      onClick={openSearch}
      className={cn(
        "w-full justify-start h-9 px-3 text-muted-foreground",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Search className="h-4 w-4 mr-2" />
      <span className="text-sm">Search...</span>
      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
