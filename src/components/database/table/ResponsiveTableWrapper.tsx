
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DatabaseField } from '@/types/database';
import { VirtualizedTable } from './VirtualizedTable';
import { MobileSummaryCards } from './MobileSummaryCards';
import { SortRule } from '@/components/database/SortingModal';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface ResponsiveTableWrapperProps {
  pages: PageWithProperties[];
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  isLoading?: boolean;
  maxHeight?: string;
  enableVirtualScrolling?: boolean;
  rowHeight?: number;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  workspaceId: string;
}

export function ResponsiveTableWrapper(props: ResponsiveTableWrapperProps) {
  const isMobile = useIsMobile();

  // On mobile/tablet, show summary cards instead of table
  if (isMobile) {
    return <MobileSummaryCards {...props} />;
  }

  // On desktop, show the full table
  return <VirtualizedTable {...props} />;
}
