
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface LinkDisplayProps {
  value: string | null;
}

export function LinkDisplay({ value }: LinkDisplayProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  // Check if the value is a URL
  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // Check if the value looks like a URL (starts with http/https or common patterns)
  const looksLikeUrl = (str: string) => {
    return /^(https?:\/\/|www\.|[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/.test(str);
  };

  if (isUrl(value) || looksLikeUrl(value)) {
    const href = value.startsWith('http') ? value : `https://${value}`;
    const displayText = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    return (
      <div className="flex items-center gap-2">
        <a 
          href={href}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 hover:underline transition-colors duration-150 truncate max-w-[200px] inline-block"
          title={value}
        >
          {displayText}
        </a>
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </div>
    );
  }

  // For non-URL text, just display as is
  return <span className="text-foreground truncate">{value}</span>;
}
