
import React from 'react';

interface LinkDisplayProps {
  value: string | null;
}

export function LinkDisplay({ value }: LinkDisplayProps) {
  if (!value) {
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
      <a 
        href={href}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150 truncate max-w-[200px] inline-block"
        title={value}
      >
        {displayText}
      </a>
    );
  }

  // For non-URL text, just display as is
  return <span className="truncate">{value}</span>;
}
