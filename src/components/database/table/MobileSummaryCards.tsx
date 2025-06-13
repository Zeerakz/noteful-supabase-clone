
import React, { useState } from 'react';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';
import { MobileSummaryCard } from './MobileSummaryCard';
import { MobileTableHeader } from './MobileTableHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
}

interface MobileSummaryCardsProps {
  pages: PageWithProperties[];
  fields: DatabaseField[];
  onTitleUpdate: (pageId: string, newTitle: string) => void;
  onPropertyUpdate: (pageId: string, fieldId: string, value: string) => void;
  onDeleteRow: (pageId: string) => void;
  isLoading?: boolean;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  workspaceId: string;
}

export function MobileSummaryCards({
  pages,
  fields,
  onTitleUpdate,
  onPropertyUpdate,
  onDeleteRow,
  isLoading = false,
  sortRules,
  setSortRules,
  workspaceId
}: MobileSummaryCardsProps) {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Prioritize fields for mobile display
  const prioritizedFields = React.useMemo(() => {
    // Always show first 2-3 most important fields on cards
    const priorityTypes = ['status', 'date', 'person', 'select'];
    const priority = fields.filter(field => priorityTypes.includes(field.type));
    const remaining = fields.filter(field => !priorityTypes.includes(field.type));
    return [...priority.slice(0, 3), ...remaining];
  }, [fields]);

  const handleCardSelect = (pageId: string, selected: boolean) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(pageId);
      } else {
        newSet.delete(pageId);
      }
      return newSet;
    });
  };

  const handleCreateRow = async () => {
    // This would typically call a create function passed as prop
    console.log('Create new row on mobile');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-card rounded-lg border animate-pulse">
            <div className="h-5 bg-muted rounded w-3/4 mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mobile Header with sorting and actions */}
      <MobileTableHeader
        fields={fields}
        sortRules={sortRules}
        setSortRules={setSortRules}
        selectedCount={selectedCards.size}
        totalCount={pages.length}
        onSelectAll={(selected) => {
          if (selected) {
            setSelectedCards(new Set(pages.map(p => p.id)));
          } else {
            setSelectedCards(new Set());
          }
        }}
      />

      {/* Scrollable cards container */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {pages.map((page) => (
          <MobileSummaryCard
            key={page.id}
            page={page}
            fields={prioritizedFields}
            allFields={fields}
            onTitleUpdate={onTitleUpdate}
            onPropertyUpdate={onPropertyUpdate}
            onDeleteRow={onDeleteRow}
            workspaceId={workspaceId}
            isSelected={selectedCards.has(page.id)}
            onSelect={handleCardSelect}
          />
        ))}

        {/* Add new row button */}
        <Button
          onClick={handleCreateRow}
          variant="outline"
          className="w-full h-12 border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 motion-interactive"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add new row
        </Button>
      </div>
    </div>
  );
}
