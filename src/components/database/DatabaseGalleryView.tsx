import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Images, Plus } from 'lucide-react';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { PageService } from '@/services/pageService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { GalleryViewHeader } from './gallery/GalleryViewHeader';
import { GalleryCard } from './gallery/GalleryCard';
import { MasonryLayout } from './gallery/MasonryLayout';
import { PageWithProperties, GalleryViewSettings } from './gallery/types';
import { cn } from '@/lib/utils';

interface DatabaseGalleryViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
}

const DEFAULT_SETTINGS: GalleryViewSettings = {
  cardSize: 'medium',
  coverFieldId: null,
  visibleProperties: [],
  layout: 'grid'
};

export function DatabaseGalleryView({
  databaseId,
  workspaceId,
  fields,
  filterGroup,
  sortRules
}: DatabaseGalleryViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<GalleryViewSettings>(() => ({
    ...DEFAULT_SETTINGS,
    visibleProperties: fields.slice(0, 3).map(f => f.id), // Show first 3 fields by default
    coverFieldId: fields.find(f => f.type === 'image' || f.type === 'file_attachment')?.id || null
  }));
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  const {
    pages,
    loading: pagesLoading,
    error: pagesError,
    refetch: refetchPages
  } = useFilteredDatabasePages({
    databaseId,
    filterGroup,
    fields,
    sortRules
  });

  // Update default settings when fields change
  useEffect(() => {
    if (fields.length > 0 && settings.visibleProperties.length === 0) {
      setSettings(prev => ({
        ...prev,
        visibleProperties: fields.slice(0, 3).map(f => f.id),
        coverFieldId: prev.coverFieldId || fields.find(f => f.type === 'image' || f.type === 'file_attachment')?.id || null
      }));
    }
  }, [fields, settings.visibleProperties.length]);

  // Transform pages data and identify media
  const pagesWithProperties: PageWithProperties[] = React.useMemo(() => {
    return pages.map(page => {
      const properties: Record<string, string> = {};
      const pageProperties = (page as any).page_properties || [];
      
      pageProperties.forEach((prop: any) => {
        properties[prop.field_id] = prop.value || '';
      });

      // Find cover media based on selected cover field
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'file' | undefined;
      let fileName: string | undefined;

      if (settings.coverFieldId) {
        const value = properties[settings.coverFieldId];
        if (value) {
          const field = fields.find(f => f.id === settings.coverFieldId);
          if (field?.type === 'file_attachment') {
            mediaType = 'file';
            fileName = value;
            mediaUrl = value;
          } else if (field?.type === 'image') {
            mediaType = 'image';
            mediaUrl = value;
          }
        }
      }

      return {
        id: page.id,
        title: page.title,
        properties,
        mediaUrl,
        mediaType,
        fileName,
      };
    });
  }, [pages, fields, settings.coverFieldId]);

  // Generate signed URLs for images when needed
  useEffect(() => {
    const generateSignedUrls = async () => {
      const urlPromises = pagesWithProperties
        .filter(page => page.mediaType === 'image' && page.mediaUrl && !mediaUrls[page.id])
        .map(async (page) => {
          try {
            const { data, error } = await supabase.storage
              .from('planna_uploads')
              .createSignedUrl(page.mediaUrl!, 3600);

            if (data?.signedUrl && !error) {
              return { pageId: page.id, url: data.signedUrl };
            }
          } catch (error) {
            console.warn('Failed to generate signed URL for page:', page.id, error);
          }
          return null;
        });

      const results = await Promise.all(urlPromises);
      const newUrls: Record<string, string> = {};
      
      results.forEach(result => {
        if (result) {
          newUrls[result.pageId] = result.url;
        }
      });

      if (Object.keys(newUrls).length > 0) {
        setMediaUrls(prev => ({ ...prev, ...newUrls }));
      }
    };

    if (pagesWithProperties.length > 0) {
      generateSignedUrls();
    }
  }, [pagesWithProperties, mediaUrls]);

  const handleCreateEntry = async () => {
    if (!user) return;

    try {
      const { data, error } = await PageService.createPage(
        workspaceId,
        user.id,
        { title: 'Untitled', databaseId }
      );
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "New entry created",
        });
        refetchPages();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create entry",
        variant: "destructive",
      });
    }
  };

  const handlePageSelect = (pageId: string, selected: boolean) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(pageId);
      } else {
        newSet.delete(pageId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedPages(new Set(pagesWithProperties.map(p => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedPages(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedPages).map(pageId => PageService.deletePage(pageId))
      );
      
      toast({
        title: "Success",
        description: `Deleted ${selectedPages.size} entries`,
      });
      
      setSelectedPages(new Set());
      refetchPages();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete selected entries",
        variant: "destructive",
      });
    }
  };

  const handlePageEdit = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
  };

  const handlePageView = (pageId: string) => {
    navigate(`/workspace/${workspaceId}/page/${pageId}`);
  };

  const handlePageDelete = async (pageId: string) => {
    try {
      const { error } = await PageService.deletePage(pageId);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Entry deleted",
        });
        refetchPages();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  const getGridColumns = () => {
    switch (settings.cardSize) {
      case 'small':
        return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6';
      case 'medium':
        return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4';
      case 'large':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  if (pagesLoading) {
    return (
      <div className="space-y-4">
        <div className={cn("grid gap-4", getGridColumns())}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (pagesError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pagesError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetchPages}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (pagesWithProperties.length === 0) {
    return (
      <div className="space-y-4">
        <GalleryViewHeader
          settings={settings}
          fields={fields}
          selectedCount={0}
          totalCount={0}
          onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
          onCreateEntry={handleCreateEntry}
        />
        
        <div className="text-center py-12">
          <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Entries Found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first database entry to see it in the gallery.
          </p>
          <Button className="gap-2" onClick={handleCreateEntry}>
            <Plus className="h-4 w-4" />
            Create First Entry
          </Button>
        </div>
      </div>
    );
  }

  const galleryCards = pagesWithProperties.map((page) => (
    <GalleryCard
      key={page.id}
      page={page}
      fields={fields}
      settings={settings}
      signedUrl={mediaUrls[page.id]}
      isSelected={selectedPages.has(page.id)}
      onSelect={(selected) => handlePageSelect(page.id, selected)}
      onEdit={() => handlePageEdit(page.id)}
      onView={() => handlePageView(page.id)}
      onDelete={() => handlePageDelete(page.id)}
    />
  ));

  return (
    <div className="space-y-4">
      <GalleryViewHeader
        settings={settings}
        fields={fields}
        selectedCount={selectedPages.size}
        totalCount={pagesWithProperties.length}
        onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        onCreateEntry={handleCreateEntry}
        onBulkDelete={handleBulkDelete}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
      />

      {settings.layout === 'masonry' ? (
        <MasonryLayout columns={settings.cardSize === 'large' ? 3 : settings.cardSize === 'medium' ? 4 : 6}>
          {galleryCards}
        </MasonryLayout>
      ) : (
        <div className={cn("grid gap-4", getGridColumns())}>
          {galleryCards}
        </div>
      )}
    </div>
  );
}
