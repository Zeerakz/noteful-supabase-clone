
import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { PagePropertiesSection } from '@/components/database/fields/PagePropertiesSection';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { usePageProperties } from '@/hooks/usePageProperties';
import { usePageWithWorkspace } from '@/hooks/usePageWithWorkspace';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { errorHandler } from '@/utils/errorHandler';

export function PageView() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  
  // Use the new custom hooks
  const { pageWithWorkspace, loading: pageLoading, error: pageError } = usePageWithWorkspace(pageId, workspacesLoading);
  const { userProfiles } = useUserProfiles(pageWithWorkspace?.workspace?.id);
  
  // Get database fields and properties if this page belongs to a database
  const { fields } = useDatabaseFields(pageWithWorkspace?.database_id || '');
  const { properties, updateProperty } = usePageProperties(pageId);

  const handlePropertyUpdate = async (fieldId: string, value: string) => {
    try {
      console.log('🔄 Updating property:', { fieldId, value });
      const result = await updateProperty(fieldId, value);
      if (result.error) {
        throw new Error(result.error);
      }
      console.log('✅ Property updated successfully');
    } catch (error) {
      console.error('❌ Property update failed:', error);
      errorHandler.logError(error as Error, { context: 'property_update', fieldId, value });
      throw error;
    }
  };

  const handleBack = () => {
    if (pageWithWorkspace?.workspace) {
      navigate(`/workspace/${pageWithWorkspace.workspace.id}`);
    } else {
      navigate('/');
    }
  };

  // Loading state
  if (workspacesLoading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Error state
  if (pageError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Error loading page</div>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Page not found
  if (!pageWithWorkspace) {
    return <Navigate to="/" replace />;
  }

  const { workspace, ...page } = pageWithWorkspace;

  // Show properties section if this page belongs to a database
  const showProperties = page.database_id && fields.length > 0;

  // Convert properties array to Record<string, string> format
  const propertiesRecord = properties.reduce((acc, property) => {
    acc[property.field_id] = property.value || '';
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{page.title}</h1>
              <p className="text-sm text-muted-foreground">in {workspace.name}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Properties Section */}
        {showProperties && (
          <PagePropertiesSection
            fields={fields}
            properties={propertiesRecord}
            pageId={page.id}
            workspaceId={workspace.id}
            onPropertyUpdate={handlePropertyUpdate}
            isEditable={true}
            pageData={page}
            userProfiles={userProfiles}
          />
        )}

        {/* Page Content */}
        <BlockEditor pageId={page.id} isEditable={true} workspaceId={workspace.id} />
      </div>
    </div>
  );
}
