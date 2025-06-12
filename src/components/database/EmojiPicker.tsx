
import React from 'react';
import { Button } from '@/components/ui/button';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  '📊', '📈', '📉', '📋', '📝', '📌', '📍', '📎', '📁', '📂',
  '🎯', '🔥', '⭐', '💡', '🚀', '🎉', '✅', '❌', '⚡', '💎',
  '📚', '🔍', '📱', '💻', '🖥️', '⚙️', '🛠️', '🔧', '🔨', '📦',
  '🎨', '🎭', '🎪', '🎵', '🎸', '📷', '🎬', '🎮', '🏆', '🎲',
  '🌟', '🌙', '☀️', '⛅', '🌈', '🔔', '📢', '📣', '💬', '💭'
];

const EMOJI_CATEGORIES = [
  { name: 'Business', emojis: ['📊', '📈', '📉', '📋', '📝', '💼', '💰', '📞', '📧', '🏢'] },
  { name: 'Tasks', emojis: ['✅', '❌', '📌', '📍', '⏰', '📅', '📆', '⭐', '🎯', '🔥'] },
  { name: 'Tech', emojis: ['💻', '📱', '🖥️', '⚙️', '🛠️', '🔧', '💾', '🔌', '📡', '🤖'] },
  { name: 'Creative', emojis: ['🎨', '🎭', '🎪', '🎵', '📷', '🎬', '✏️', '🖊️', '🖌️', '📐'] }
];

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <div className="w-80 max-h-96 overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Common/Recently Used */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Common</h4>
          <div className="grid grid-cols-10 gap-1">
            {COMMON_EMOJIS.slice(0, 20).map((emoji, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={() => onEmojiSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>

        {/* Categories */}
        {EMOJI_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">{category.name}</h4>
            <div className="grid grid-cols-10 gap-1">
              {category.emojis.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => onEmojiSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
