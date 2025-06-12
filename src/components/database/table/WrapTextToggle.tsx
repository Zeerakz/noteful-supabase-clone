
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WrapText } from 'lucide-react';

interface WrapTextToggleProps {
  isWrapped: boolean;
  onToggle: () => void;
  className?: string;
}

export function WrapTextToggle({ isWrapped, onToggle, className = '' }: WrapTextToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={`h-6 w-6 p-0 ${isWrapped ? 'bg-accent text-accent-foreground' : ''} ${className}`}
          >
            <WrapText className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isWrapped ? 'Disable text wrapping' : 'Enable text wrapping'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
