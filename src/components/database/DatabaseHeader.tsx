
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
      {/* Main Header - Refined Typography */}
      <div className="bg-background border-b border-border/30">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Left: Database Info - Confident but Quiet Presence */}
            <div className="flex items-center gap-4">
              {database.icon && (
                <span className="text-2xl">{database.icon}</span>
              )}
              <div>
                <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground leading-tight">
                  {database.name}
                </h1>
                {database.description && (
                  <p className="text-sm font-normal text-muted-foreground/80 mt-1.5 leading-relaxed max-w-2xl">
                    {database.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions - Secondary Weight */}
            <div className="flex items-center gap-2.5">
              {/* Breaking Changes Indicator */}
              {breakingChanges.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuditDialog(true)}
                  className="text-amber-700 border-amber-200 hover:bg-amber-50 gap-2 font-medium text-xs"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {breakingChanges.length} Breaking Change{breakingChanges.length > 1 ? 's' : ''}
                  </span>
                </Button>
              )}

              {/* Schema History */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuditDialog(true)}
                className="gap-2 font-medium text-xs text-muted-foreground hover:text-foreground"
              >
                <History className="h-3.5 w-3.5" />
                <span>History</span>
              </Button>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="font-medium text-xs">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit} className="text-sm font-medium">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Database
                    </DropdownMenuItem>
                  )}
                  
                  {onDuplicate && (
                    <DropdownMenuItem onClick={onDuplicate} className="text-sm font-medium">
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                  )}
                  
                  {onExport && (
                    <DropdownMenuItem onClick={onExport} className="text-sm font-medium">
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
                      className="text-red-600 focus:text-red-600 text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Database
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Breaking Changes Alert Bar */}
      {breakingChanges.length > 0 && (
        <div className="px-6 py-3 border-b bg-amber-50/50">
          <BreakingChangesAlert breakingChanges={breakingChanges} />
        </div>
      )}

      {/* Schema Audit Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Schema History & Breaking Changes</DialogTitle>
            <DialogDescription className="text-sm font-normal text-muted-foreground">
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
