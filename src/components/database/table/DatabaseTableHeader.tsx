
import React from 'react';
import { DatabaseColumnHeader } from './DatabaseColumnHeader';
import { DatabaseField } from '@/types/database';
import { SortRule } from '@/components/database/SortingModal';

interface DatabaseTableHeaderProps {
  fields: DatabaseField[];
  sortRules: SortRule[];
  onSort: (fieldId: string, direction: 'asc' | 'desc') => void;
  onFieldsChange?: () => void;
}

export function DatabaseTableHeader({ fields, sortRules, onSort, onFieldsChange }: DatabaseTableHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="flex">
        {/* Title Column */}
        <div className="min-w-[200px] w-[200px] flex-shrink-0 border-r border-border">
          <DatabaseColumnHeader
            field={{
              id: 'title',
              name: 'Title',
              type: 'text',
              database_id: fields[0]?.database_id || '',
              pos: -1,
              settings: {},
              created_by: '',
              created_at: '',
              updated_at: ''
            }}
            sortRules={sortRules}
            onSort={onSort}
            onFieldsChange={onFieldsChange}
            isResizable={false}
          />
        </div>

        {/* Field Columns */}
        {fields.map((field) => (
          <div key={field.id} className="min-w-[150px] flex-shrink-0 border-r border-border last:border-r-0">
            <DatabaseColumnHeader
              field={field}
              sortRules={sortRules}
              onSort={onSort}
              onFieldsChange={onFieldsChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
