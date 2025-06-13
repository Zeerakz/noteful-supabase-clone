import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { PagePropertiesSection } from '@/components/database/fields/PagePropertiesSection';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { usePageData } from '@/hooks/usePageData';
import { useStablePageProperties } from '@/hooks/useStablePageProperties';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { errorHandler } from '@/utils/errorHandler';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

function PageViewContent() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  
  // Use the stable hooks
  const { pageData, loading: pageLoading, error: pageError, retry: retryPage } = usePageData(pageId);
  const { properties, loading: propertiesLoading, error: propertiesError, updateProperty, retry: retryProperties } = useStablePageProperties(pageId);
  const { userProfiles } = useUserProfiles(pageData?.workspace?.id);
  const { fields } = useDatabaseFields(pageData?.database_id || '', pageData?.workspace?.id || '');

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
    if (pageData?.workspace) {
      navigate(`/workspace/${pageData.workspace.id}`);
    } else {
      navigate('/');
    }
  };

  const handleRetry = () => {
    retryPage();
    retryProperties();
  };

  // Loading state
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading page...</div>
      </div>
    );
  }

  // Error state
  if (pageError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-lg text-red-600">Error loading page</div>
          <p className="text-muted-foreground">{pageError}</p>
          <div className="space-x-2">
            <Button onClick={handleRetry}>Try Again</Button>
            <Button variant="outline" onClick={handleBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  // Page not found
  if (!pageData) {
    return <Navigate to="/" replace />;
  }

  // Show properties section if this page belongs to a database
  const showProperties = pageData.database_id && fields.length > 0;

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
              <h1 className="text-xl font-semibold">{pageData.title}</h1>
              <p className="text-sm text-muted-foreground">in {pageData.workspace.name}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Properties Section */}
        {showProperties && (
          <ErrorBoundary
            fallback={
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <p className="text-red-600">Error loading properties</p>
                {propertiesError && <p className="text-sm text-red-500 mt-1">{propertiesError}</p>}
                <Button size="sm" onClick={retryProperties} className="mt-2">
                  Retry Properties
                </Button>
              </div>
            }
          >
            <PagePropertiesSection
              fields={fields}
              properties={propertiesRecord}
              pageId={pageData.id}
              workspaceId={pageData.workspace.id}
              onPropertyUpdate={handlePropertyUpdate}
              isEditable={true}
              pageData={pageData}
              userProfiles={userProfiles}
            />
          </ErrorBoundary>
        )}

        {/* Page Content */}
        <ErrorBoundary
          fallback={
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <p className="text-red-600">Error loading page content</p>
              <p className="text-sm text-red-500 mt-1">
                There was an issue loading the page editor.
              </p>
              <Button size="sm" onClick={handleRetry} className="mt-2">
                Retry
              </Button>
            </div>
          }
        >
          <BlockEditor pageId={pageData.id} isEditable={true} workspaceId={pageData.workspace.id} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export function PageView() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        errorHandler.logError(error, {
          context: 'page_view_root',
          componentStack: errorInfo.componentStack
        });
      }}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-foreground">Page Error</h3>
            <p className="text-muted-foreground">
              There was an error loading this page. Please try refreshing or navigating elsewhere.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <PageViewContent />
    </ErrorBoundary>
  );
}
