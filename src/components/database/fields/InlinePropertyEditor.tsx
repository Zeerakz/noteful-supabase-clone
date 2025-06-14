
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DatabaseField } from '@/types/database';
import { PropertyMigrationDialog } from './PropertyMigrationDialog';
import { Edit, Copy, Trash2, ArrowUpDown } from 'lucide-react';

interface InlinePropertyEditorProps {
  field: DatabaseField;
  onUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onDuplicate: (field: DatabaseField) => Promise<void>;
  onDelete: (fieldId: string) => Promise<void>;
  children: React.ReactNode;
}

export function InlinePropertyEditor({
  field,
  onUpdate,
  onDuplicate,
  onDelete,
  children
}: InlinePropertyEditorProps) {
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  const handleMigrationComplete = () => {
    // The migration service handles the updates, so we just need to refresh
    window.location.reload(); // Simple refresh for now
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled>
            <Edit className="h-4 w-4 mr-2" />
            Edit Property
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowMigrationDialog(true)}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Change Type
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onDuplicate(field)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => onDelete(field.id)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PropertyMigrationDialog
        open={showMigrationDialog}
        onOpenChange={setShowMigrationDialog}
        field={field}
        onMigrationComplete={handleMigrationComplete}
      />
    </>
  );
}
