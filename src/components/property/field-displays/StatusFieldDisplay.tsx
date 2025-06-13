
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusPropertyConfig } from '@/types/property';

interface StatusFieldDisplayProps {
  value: any;
  config: StatusPropertyConfig;
  field?: any;
  pageId?: string;
  isResizing?: boolean;
}

// Natural, muted color palette inspired by pigments and nature
const naturalColors = {
  planning: {
    background: '#F4F1E8', // warm off-white like aged paper
    border: '#D4C4A8', // soft ochre
    text: '#8B7355' // deeper ochre
  },
  completed: {
    background: '#E8F2E8', // soft moss green
    border: '#B8D4B8', // muted sage
    text: '#5A7A5A' // forest green
  },
  ongoing: {
    background: '#EDF0F2', // soft slate
    border: '#C5CDD4', // gentle gray-blue
    text: '#64748B' // slate blue-gray
  },
  'in-progress': {
    background: '#EDF0F2', // soft slate
    border: '#C5CDD4', // gentle gray-blue
    text: '#64748B' // slate blue-gray
  },
  'on-hold': {
    background: '#F5F1E8', // warm cream
    border: '#E0D4B8', // muted gold
    text: '#A08660' // warm brown
  },
  blocked: {
    background: '#F2EDE8', // soft terracotta
    border: '#D4BFB0', // muted clay
    text: '#8B6B5C' // earthy brown
  },
  cancelled: {
    background: '#F0F0F0', // neutral gray
    border: '#D0D0D0', // soft gray
    text: '#6B6B6B' // medium gray
  }
};

function getNaturalColorForStatus(statusName: string) {
  const normalizedStatus = statusName.toLowerCase().replace(/\s+/g, '-');
  return naturalColors[normalizedStatus as keyof typeof naturalColors] || naturalColors.ongoing;
}

export function StatusFieldDisplay({ value, config, isResizing = false }: StatusFieldDisplayProps) {
  if (!value || value.trim() === '') {
    return (
      <span className={`text-muted-foreground ${isResizing ? 'text-muted-foreground/40' : ''}`}>
        —
      </span>
    );
  }

  // Find the option across all groups
  const allOptions = config.groups?.flatMap(group => group.options || []) || [];
  const option = allOptions.find(opt => opt.id === value);
  
  if (!option) {
    return (
      <span className={`text-muted-foreground ${isResizing ? 'text-muted-foreground/40' : ''}`}>
        {value}
      </span>
    );
  }

  // Get natural colors for this status
  const colors = getNaturalColorForStatus(option.name);

  return (
    <div 
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-150 border
        ${isResizing ? 'opacity-60' : ''}
      `}
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border,
        color: colors.text
      }}
    >
      {option.name}
    </div>
  );
}
