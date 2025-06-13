
import React, { useState, useEffect, useRef } from 'react';
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
import { errorHandler } from '@/utils/errorHandler';

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
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(true);
  
  // Use refs to track subscriptions and prevent multiple subscriptions
  const subscriptionRef = useRef<any>(null);
  const fetchedPageIdRef = useRef<string | null>(null);

  // Get database fields and properties if this page belongs to a database
  const { fields } = useDatabaseFields(pageWithWorkspace?.database_id || '');
  const { properties, updateProperty } = usePageProperties(pageId);

  // Clean up function
  const cleanup = () => {
    if (subscriptionRef.current) {
      console.log('🧹 Cleaning up page subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      setMounted(false);
      cleanup();
    };
  }, []);

  useEffect(() => {
    const fetchPageWithWorkspace = async () => {
      if (!pageId || workspacesLoading || !mounted) return;
      
      // Prevent duplicate fetches
      if (fetchedPageIdRef.current === pageId) return;
      fetchedPageIdRef.current = pageId;

      // Clean up any existing subscription
      cleanup();

      try {
        console.log('📄 Fetching page with workspace for pageId:', pageId);
        
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

        if (!mounted) return; // Component unmounted during fetch

        if (error) {
          console.error('❌ Error fetching page:', error);
          errorHandler.logError(error as Error, { context: 'page_fetch', pageId });
          setPageWithWorkspace(null);
        } else if (pageData) {
          console.log('✅ Page fetched successfully:', pageData.title);
          setPageWithWorkspace({
            ...pageData,
            workspace: pageData.workspaces
          });
        }
      } catch (err) {
        console.error('💥 Error fetching page with workspace:', err);
        errorHandler.logError(err as Error, { context: 'page_fetch_critical', pageId });
        if (mounted) {
          setPageWithWorkspace(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPageWithWorkspace();
  }, [pageId, workspacesLoading, mounted]);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (!pageWithWorkspace?.workspace.id || !mounted) return;

      try {
        console.log('👥 Fetching user profiles for workspace:', pageWithWorkspace.workspace.id);
        
        // Fetch user profiles for the workspace
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');

        if (!mounted) return; // Component unmounted during fetch

        if (error) {
          console.error('❌ Error fetching user profiles:', error);
          errorHandler.logError(error as Error, { context: 'profiles_fetch', workspaceId: pageWithWorkspace.workspace.id });
        } else {
          console.log('✅ User profiles fetched:', profiles?.length || 0);
          setUserProfiles(profiles || []);
        }
      } catch (err) {
        console.error('💥 Error fetching user profiles:', err);
        errorHandler.logError(err as Error, { context: 'profiles_fetch_critical', workspaceId: pageWithWorkspace?.workspace.id });
      }
    };

    fetchUserProfiles();
  }, [pageWithWorkspace?.workspace.id, mounted]);

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
    cleanup(); // Clean up before navigation
    navigate(`/workspace/${workspace.id}`);
  };

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
        <BlockEditor pageId={page.id} isEditable={true} />
      </div>
    </div>
  );
}
