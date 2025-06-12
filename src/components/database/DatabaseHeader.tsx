
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit2, Check, X } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface DatabaseHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onIconChange?: (icon: string) => void;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export function DatabaseHeader({
  title,
  description,
  icon = '📊',
  onTitleChange,
  onDescriptionChange,
  onIconChange,
  breadcrumbs = []
}: DatabaseHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [descriptionValue, setDescriptionValue] = useState(description || '');

  const handleTitleSave = () => {
    onTitleChange?.(titleValue);
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(title);
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    onDescriptionChange?.(descriptionValue);
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setDescriptionValue(description || '');
    setIsEditingDescription(false);
  };

  const handleIconSelect = (emoji: string) => {
    onIconChange?.(emoji);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={index}>
              {breadcrumb.href ? (
                <a 
                  href={breadcrumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {breadcrumb.label}
                </a>
              ) : (
                <span className="text-foreground">{breadcrumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="text-muted-foreground/50">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Title */}
      <div className="flex items-start gap-3">
        {/* Icon/Emoji Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-2xl hover:bg-muted/50 rounded-md"
            >
              {icon}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <EmojiPicker onEmojiSelect={handleIconSelect} />
          </PopoverContent>
        </Popover>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                className="text-2xl font-bold border-none shadow-none p-0 h-auto bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') handleTitleCancel();
                }}
                autoFocus
              />
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleSave}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleCancel}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="group flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50"
              onClick={() => setIsEditingTitle(true)}
            >
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <Edit2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        {isEditingDescription ? (
          <div className="space-y-2">
            <Textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Add a description..."
              className="min-h-[60px] resize-none border-none shadow-none p-2 bg-muted/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) handleDescriptionSave();
                if (e.key === 'Escape') handleDescriptionCancel();
              }}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleDescriptionSave}
                className="h-7"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDescriptionCancel}
                className="h-7"
              >
                Cancel
              </Button>
              <span className="text-xs text-muted-foreground">
                Press ⌘Enter to save
              </span>
            </div>
          </div>
        ) : (
          <div 
            className="group cursor-pointer rounded p-2 hover:bg-muted/50 transition-colors"
            onClick={() => setIsEditingDescription(true)}
          >
            {description ? (
              <div className="flex items-start gap-2">
                <p className="text-muted-foreground">{description}</p>
                <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/70">Add a description...</span>
                <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
