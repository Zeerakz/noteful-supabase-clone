
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageSquareIcon, MessageSquarePlusIcon } from 'lucide-react';

interface CommentIconProps {
  hasComments: boolean;
  commentCount: number;
  onClick: () => void;
  className?: string;
}

export function CommentIcon({ hasComments, commentCount, onClick, className }: CommentIconProps) {
  const IconComponent = hasComments ? MessageSquareIcon : MessageSquarePlusIcon;
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className={`h-6 w-6 p-0 text-muted-foreground hover:text-foreground ${className}`}
          >
            <IconComponent className="h-3 w-3" />
            {hasComments && commentCount > 0 && (
              <span className="ml-1 text-xs">{commentCount}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasComments ? `${commentCount} comments` : 'Add comment'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
