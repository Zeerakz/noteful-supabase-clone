
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitleEditor } from './PageTitleEditor';
import { SaveAsTemplateDialog } from '@/components/templates/SaveAsTemplateDialog';
import { ShareButton } from '@/components/sharing/ShareButton';
import { ActiveUsers } from '@/components/collaboration/ActiveUsers';
import { Block } from '@/types/block';

interface PageHeaderProps {
  pageTitle: string;
  workspaceName: string;
  isEditable: boolean;
  hasOptimisticChanges: boolean;
  onBack: () => void;
  onTitleUpdate: (title: string) => Promise<{ error?: string }>;
  // Template and sharing props
  pageId: string;
  workspaceId: string;
  blocks: Block[];
  canManagePermissions: boolean;
  // Collaboration props
  activeUsers: any[];
  presenceLoading: boolean;
}

export function PageHeader({
  pageTitle,
  workspaceName,
  isEditable,
  hasOptimisticChanges,
  onBack,
  onTitleUpdate,
  pageId,
  workspaceId,
  blocks,
  canManagePermissions,
  activeUsers,
  presenceLoading
}: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-background sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <PageTitleEditor
                title={pageTitle}
                isEditable={isEditable}
                onTitleUpdate={onTitleUpdate}
                hasOptimisticChanges={hasOptimisticChanges}
              />
              <p className="text-sm text-muted-foreground">in {workspaceName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {canManagePermissions && (
              <ShareButton blockId={pageId} workspaceId={workspaceId} />
            )}
            {/* Save as Template button */}
            {isEditable && blocks.length > 0 && (
              <SaveAsTemplateDialog
                pageId={pageId}
                workspaceId={workspaceId}
                title={pageTitle}
                blocks={blocks}
              />
            )}
            
            {/* Show active users */}
            <ActiveUsers activeUsers={activeUsers} loading={presenceLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
