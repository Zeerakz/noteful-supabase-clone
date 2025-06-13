
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

interface SearchTriggerProps {
  onSelect?: () => void;
}

export function SearchTrigger({ onSelect }: SearchTriggerProps) {
  const { openSearch } = useGlobalSearch();

  const handleClick = () => {
    openSearch();
    onSelect?.();
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className="w-full justify-start gap-2 px-2 py-1.5 h-auto text-sm sidebar-focus-ring"
      aria-label="Open global search"
    >
      <Search className="h-4 w-4" />
      <span>Search...</span>
    </Button>
  );
}
