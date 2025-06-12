
import React, { useState } from 'react';
import { Block } from '@/hooks/useBlocks';
import { Button } from '@/components/ui/button';
import { Trash2, Lightbulb, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RichTextEditor } from './RichTextEditor';
import { CommentIcon } from './CommentIcon';
import { CommentThreadPanel } from './CommentThreadPanel';
import { useComments } from '@/hooks/useComments';

interface CalloutBlockProps {
  block: Block;
  onUpdate: (content: any) => Promise<void>;
  onDelete: () => Promise<void>;
  isEditable: boolean;
}

const calloutTypes = [
  { id: 'info', emoji: '💡', icon: Lightbulb, label: 'Info', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-900' },
  { id: 'warning', emoji: '⚠️', icon: AlertTriangle, label: 'Warning', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-900' },
  { id: 'error', emoji: '❌', icon: AlertTriangle, label: 'Error', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-900' },
  { id: 'success', emoji: '✅', icon: CheckCircle, label: 'Success', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-900' },
  { id: 'note', emoji: 'ℹ️', icon: Info, label: 'Note', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-900' },
];

export function CalloutBlock({ block, onUpdate, onDelete, isEditable }: CalloutBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { comments } = useComments(block.id);

  const currentType = calloutTypes.find(type => type.id === block.content?.type) || calloutTypes[0];
  const customEmoji = block.content?.emoji;
  const displayEmoji = customEmoji || currentType.emoji;

  const handleContentChange = async (content: any) => {
    await onUpdate({ 
      ...block.content,
      text: content 
    });
  };

  const handleTypeChange = async (typeId: string) => {
    const newType = calloutTypes.find(type => type.id === typeId);
    if (newType) {
      await onUpdate({ 
        ...block.content,
        type: typeId,
        emoji: newType.emoji // Reset to default emoji when changing type
      });
    }
  };

  const handleEmojiChange = async (newEmoji: string) => {
    await onUpdate({ 
      ...block.content,
      emoji: newEmoji 
    });
  };

  const handleDelete = async () => {
    await onDelete();
  };

  if (!isEditable) {
    return (
      <div className={`p-4 rounded-lg border-l-4 ${currentType.bgColor} ${currentType.borderColor} my-4`}>
        <div className="flex items-start gap-3">
          <div className="text-xl flex-shrink-0 mt-0.5">
            {displayEmoji}
          </div>
          <div 
            className={`flex-1 rich-text-content ${currentType.textColor}`}
            dangerouslySetInnerHTML={{ __html: block.content?.text || '' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative ${currentType.bgColor} ${currentType.borderColor} my-4`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 p-4 rounded-lg border-l-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Emoji/Icon selector */}
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={displayEmoji}
              onChange={(e) => handleEmojiChange(e.target.value)}
              className="w-8 h-8 text-center text-xl bg-transparent border-none outline-none resize-none"
              placeholder="😀"
              maxLength={2}
            />
            
            {/* Type selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-8 p-0 opacity-50 hover:opacity-100"
                >
                  <currentType.icon className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {calloutTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.id}
                    onClick={() => handleTypeChange(type.id)}
                    className="flex items-center gap-2"
                  >
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content editor */}
          <div className={`flex-1 ${currentType.textColor}`}>
            <RichTextEditor
              initialContent={block.content?.text || ''}
              onBlur={handleContentChange}
              placeholder="Enter your callout message..."
            />
          </div>
        </div>
        
        {isHovered && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
            <CommentThreadPanel
              blockId={block.id}
              isOpen={isCommentPanelOpen}
              onOpenChange={setIsCommentPanelOpen}
            >
              <CommentIcon
                hasComments={comments.length > 0}
                commentCount={comments.length}
                onClick={() => setIsCommentPanelOpen(true)}
              />
            </CommentThreadPanel>
            
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
