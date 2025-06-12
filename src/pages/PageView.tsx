
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockEditor } from '@/components/blocks/BlockEditor';
import { PagePropertiesSection } from '@/components/database/fields/PagePropertiesSection';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { usePageProperties } from '@/hooks/usePageProperties';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/page';

interface PageWithWorkspace extends Page {
  workspace: {
    id: string;
    name: string;
  };
}

export function PageView() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const [pageWithWorkspace, setPageWithWorkspace] = useState<PageWithWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Get database fields and properties if this page belongs to a database
  const { fields } = useDatabaseFields(pageWithWorkspace?.database_id || '');
  const { properties, updateProperty } = usePageProperties(pageId);

  useEffect(() => {
    const fetchPageWithWorkspace = async () => {
      if (!pageId || workspacesLoading) return;

      try {
        // Fetch the page directly with its workspace info
        const { data: pageData, error } = await supabase
          .from('pages')
          .select(`
            *,
            workspaces!inner (
              id,
              name
            )
          `)
          .eq('id', pageId)
          .single();

        if (error) {
          console.error('Error fetching page:', error);
          setPageWithWorkspace(null);
        } else if (pageData) {
          setPageWithWorkspace({
            ...pageData,
            workspace: pageData.workspaces
          });
        }
      } catch (err) {
        console.error('Error fetching page with workspace:', err);
        setPageWithWorkspace(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPageWithWorkspace();
  }, [pageId, workspacesLoading]);

  const handlePropertyUpdate = async (fieldId: string, value: string) => {
    const result = await updateProperty(fieldId, value);
    if (result.error) {
      throw new Error(result.error);
    }
  };

  if (workspacesLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!pageWithWorkspace) {
    return <Navigate to="/" replace />;
  }

  const { workspace, ...page } = pageWithWorkspace;

  const handleBack = () => {
    navigate(`/workspace/${workspace.id}`);
  };

  // Show properties section if this page belongs to a database
  const showProperties = page.database_id && fields.length > 0;

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
            properties={properties}
            pageId={page.id}
            workspaceId={workspace.id}
            onPropertyUpdate={handlePropertyUpdate}
            isEditable={true}
          />
        )}

        {/* Page Content */}
        <BlockEditor pageId={page.id} isEditable={true} />
      </div>
    </div>
  );
}
