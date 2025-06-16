
import React from 'react';
import { Navigate } from 'react-router-dom';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { PresenceProvider } from '@/components/collaboration/PresenceProvider';
import { PageHeader } from '@/components/page/PageHeader';
import { usePageEditor } from '@/hooks/usePageEditor';

// Import to register the new property type
import '@/components/property/types/AiAutofillPropertyType';

export function PageEditor() {
  const {
    workspaceId,
    pageId,
    handleBack,
    pageData,
    pageLoading,
    pageError,
    workspacesLoading,
    permissionsLoading,
    presenceLoading,
    workspace,
    blocks,
    activeUsers,
    permissions,
    hasAnyOptimisticChanges,
    handleTitleUpdate,
  } = usePageEditor();

  // Handle conditional rendering after all hooks are called
  if (!workspaceId || !pageId) {
    return <Navigate to="/" replace />;
  }

  if (pageLoading || workspacesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (pageError || !pageData || !workspace) {
    return <Navigate to="/" replace />;
  }

  // For now, we'll assume users can edit if they have access to the page
  // This should be enhanced with proper role checking
  const isEditable = permissions.canEdit;
  const pageTitle = (pageData.properties as any)?.title || 'Untitled';

  return (
    <PresenceProvider pageId={pageId}>
      <div className="min-h-screen bg-background">
        <PageHeader
          pageTitle={pageTitle}
          workspaceName={workspace.name}
          isEditable={isEditable}
          hasOptimisticChanges={hasAnyOptimisticChanges}
          onBack={handleBack}
          onTitleUpdate={handleTitleUpdate}
          pageId={pageData.id}
          workspaceId={workspaceId}
          blocks={blocks}
          canManagePermissions={permissions.canManagePermissions}
          activeUsers={activeUsers}
          presenceLoading={presenceLoading}
        />
        
        <div className="container mx-auto max-w-4xl">
          <BlockEditor pageId={pageData.id} isEditable={isEditable} workspaceId={workspaceId} />
        </div>
      </div>
    </PresenceProvider>
  );
}
