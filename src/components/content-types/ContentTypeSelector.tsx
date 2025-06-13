
import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  ContentType,
  ContentCategory,
  ContentTypeUtils,
  CONTENT_TYPE_LABELS
} from '@/types/contentTypes';
import { ContentTypeIcon } from './ContentTypeIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContentTypeSelectorProps {
  selectedType?: ContentType;
  onTypeChange: (type: ContentType) => void;
  context?: 'workspace' | 'project' | 'personal' | 'team';
  disabled?: boolean;
  className?: string;
}

/**
 * ContentTypeSelector component for choosing content types
 * 
 * Features:
 * - Organized by categories for easy navigation
 * - Context-aware suggestions
 * - Visual icons for each type
 * - Accessible dropdown interface
 */
export function ContentTypeSelector({
  selectedType,
  onTypeChange,
  context = 'workspace',
  disabled = false,
  className
}: ContentTypeSelectorProps) {
  const [open, setOpen] = useState(false);

  const suggestedTypes = ContentTypeUtils.getSuggestedTypes(context);
  
  // Group all content types by category
  const categorizedTypes = Object.values(ContentCategory).reduce((acc, category) => {
    const types = ContentTypeUtils.getTypesByCategory(category);
    if (types.length > 0) {
      acc[category] = types;
    }
    return acc;
  }, {} as Record<ContentCategory, ContentType[]>);

  const categoryLabels: Record<ContentCategory, string> = {
    [ContentCategory.CORE]: 'Core',
    [ContentCategory.PAGES]: 'Pages',
    [ContentCategory.DATABASES]: 'Databases', 
    [ContentCategory.PROJECTS]: 'Projects',
    [ContentCategory.ANALYTICS]: 'Analytics',
    [ContentCategory.COLLABORATION]: 'Collaboration',
    [ContentCategory.MEDIA]: 'Media',
    [ContentCategory.KNOWLEDGE]: 'Knowledge',
    [ContentCategory.BUSINESS]: 'Business',
    [ContentCategory.PERSONAL]: 'Personal',
    [ContentCategory.TEMPLATES]: 'Templates',
    [ContentCategory.SYSTEM]: 'System'
  };

  const handleTypeSelect = (type: ContentType) => {
    onTypeChange(type);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {selectedType && <ContentTypeIcon contentType={selectedType} size="sm" />}
            <span>
              {selectedType ? CONTENT_TYPE_LABELS[selectedType] : 'Select type...'}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px] p-0" align="start">
        {/* Suggested types for the current context */}
        {suggestedTypes.length > 0 && (
          <>
            <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
              Suggested for {context}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {suggestedTypes.map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className="flex items-center gap-2 px-2 py-1.5"
                >
                  <ContentTypeIcon contentType={type} size="sm" showTooltip={false} />
                  <span className="flex-1">{CONTENT_TYPE_LABELS[type]}</span>
                  {selectedType === type && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* All types organized by category */}
        <div className="max-h-[400px] overflow-y-auto">
          {Object.entries(categorizedTypes).map(([category, types]) => (
            <React.Fragment key={category}>
              <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
                {categoryLabels[category as ContentCategory]}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {types.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className="flex items-center gap-2 px-2 py-1.5"
                  >
                    <ContentTypeIcon contentType={type} size="sm" showTooltip={false} />
                    <span className="flex-1">{CONTENT_TYPE_LABELS[type]}</span>
                    {selectedType === type && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </React.Fragment>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
