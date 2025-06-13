
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MoreVertical, 
  Settings, 
  Copy, 
  Trash2, 
  Download,
  History,
  AlertTriangle
} from 'lucide-react';
import { Database } from '@/types/database';
import { useSchemaAudit } from '@/hooks/useSchemaAudit';
import { BreakingChangesAlert } from './BreakingChangesAlert';
import { SchemaAuditPanel } from './SchemaAuditPanel';

interface DatabaseHeaderProps {
  database: Database;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export function DatabaseHeader({
  database,
  onEdit,
  onDuplicate,
  onDelete,
  onExport
}: DatabaseHeaderProps) {
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const { auditLogs, breakingChanges, loading } = useSchemaAudit(database.id);

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {database.icon && (
              <span className="text-2xl">{database.icon}</span>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{database.name}</h1>
              {database.description && (
                <p className="text-muted-foreground mt-1">{database.description}</p>
              )}
            </div>
          </div>
          
          {/* Breaking Changes Alert */}
          {breakingChanges.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuditDialog(true)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {breakingChanges.length} Breaking Change{breakingChanges.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAuditDialog(true)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Schema History
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Database
                </DropdownMenuItem>
              )}
              
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
              )}
              
              {(onEdit || onDuplicate || onExport) && onDelete && (
                <DropdownMenuSeparator />
              )}
              
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Database
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Breaking Changes Alert Bar */}
      {breakingChanges.length > 0 && (
        <div className="px-6 py-3 border-b">
          <BreakingChangesAlert breakingChanges={breakingChanges} />
        </div>
      )}

      {/* Schema Audit Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Schema History & Breaking Changes</DialogTitle>
            <DialogDescription>
              Track schema changes and analyze breaking changes for API consumers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {breakingChanges.length > 0 && (
              <BreakingChangesAlert breakingChanges={breakingChanges} />
            )}
            
            <SchemaAuditPanel auditLogs={auditLogs} loading={loading} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
