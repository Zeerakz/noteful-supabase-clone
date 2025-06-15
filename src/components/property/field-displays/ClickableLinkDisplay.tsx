
```typescript
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { PropertyType } from '@/types/property';

interface ClickableLinkDisplayProps {
  value: string;
  type: PropertyType;
}

export function ClickableLinkDisplay({ value, type }: ClickableLinkDisplayProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  let href = '';
  let displayText = value;

  switch (type) {
    case 'url':
      href = value.startsWith('http') ? value : `https://${value}`;
      displayText = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
      break;
    case 'email':
      href = `mailto:${value}`;
      break;
    case 'phone':
      href = `tel:${value}`;
      break;
    default:
      return <span className="text-foreground">{value}</span>;
  }
  
  return (
    <div className="flex items-center gap-1.5">
      <a 
        href={href}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline transition-colors duration-150 truncate"
        title={value}
      >
        {displayText}
      </a>
      {type === 'url' && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
    </div>
  );
}
```
