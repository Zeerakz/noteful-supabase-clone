
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, RefreshCw, AlertTriangle, Images, File } from 'lucide-react';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { DatabaseField } from '@/types/database';
import { FilterRule } from '@/components/database/FilterModal';
import { SortRule } from '@/components/database/SortingModal';
import { PageService } from '@/services/pageService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseGalleryViewProps {
  databaseId: string;
  workspaceId: string;
  fields: DatabaseField[];
  filters: FilterRule[];
  sortRules: SortRule[];
}

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
  mediaUrl?: string;
  mediaType?: 'image' | 'file';
  fileName?: string;
}

export function DatabaseGalleryView({
  databaseId,
  workspaceId,
  fields,
  filters,
  sortRules
}: DatabaseGalleryViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  const {
    pages,
    loading: pagesLoading,
    error: pagesError,
    refetch: refetchPages
  } = useFilteredDatabasePages({
    databaseId,
    filters,
    fields,
    sortRules
  });

  // Find media fields (image or file types)
  const mediaFields = fields.filter(field => 
    field.type === 'file_attachment' || field.type === 'image'
  );

  // Transform pages data and identify media
  const pagesWithProperties: PageWithProperties[] = React.useMemo(() => {
    return pages.map(page => {
      const properties: Record<string, string> = {};
      const pageProperties = (page as any).page_properties || [];
      
      pageProperties.forEach((prop: any) => {
        properties[prop.field_id] = prop.value || '';
      });

      // Find the first media field with a value
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'file' | undefined;
      let fileName: string | undefined;

      for (const field of mediaFields) {
        const value = properties[field.id];
        if (value) {
          if (field.type === 'file_attachment') {
            mediaType = 'file';
            fileName = value;
            mediaUrl = value;
          } else if (field.type === 'image') {
            mediaType = 'image';
            mediaUrl = value;
          }
          break;
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
  }, [pages, mediaFields]);

  // Generate signed URLs for images when needed
  React.useEffect(() => {
    const generateSignedUrls = async () => {
      const urlPromises = pagesWithProperties
        .filter(page => page.mediaType === 'image' && page.mediaUrl && !mediaUrls[page.id])
        .map(async (page) => {
          try {
            const { data, error } = await supabase.storage
              .from('planna_uploads')
              .createSignedUrl(page.mediaUrl!, 3600); // 1 hour expiry

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

  if (pagesLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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

  // Filter pages that have media
  const pagesWithMedia = pagesWithProperties.filter(page => 
    page.mediaType && (page.mediaUrl || page.fileName)
  );

  if (mediaFields.length === 0) {
    return (
      <div className="text-center py-12">
        <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Media Fields</h3>
        <p className="text-muted-foreground mb-4">
          Add image or file attachment fields to use the gallery view.
        </p>
      </div>
    );
  }

  if (pagesWithMedia.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Media Gallery</h3>
          <Button size="sm" className="gap-2" onClick={handleCreateEntry}>
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
        
        <div className="text-center py-12">
          <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Media Found</h3>
          <p className="text-muted-foreground mb-4">
            Add images or files to your database entries to see them in the gallery.
          </p>
          <Button className="gap-2" onClick={handleCreateEntry}>
            <Plus className="h-4 w-4" />
            Create First Entry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Media Gallery ({pagesWithMedia.length})</h3>
        <Button size="sm" className="gap-2" onClick={handleCreateEntry}>
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {pagesWithMedia.map((page) => (
          <MediaCard
            key={page.id}
            page={page}
            signedUrl={mediaUrls[page.id]}
            fields={fields}
          />
        ))}
      </div>
    </div>
  );
}

interface MediaCardProps {
  page: PageWithProperties;
  signedUrl?: string;
  fields: DatabaseField[];
}

function MediaCard({ page, signedUrl, fields }: MediaCardProps) {
  const getFieldName = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.name || '';
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
      <div className="aspect-square relative bg-muted">
        {page.mediaType === 'image' ? (
          signedUrl ? (
            <img
              src={signedUrl}
              alt={page.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Images className="h-8 w-8 text-muted-foreground" />
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <File className="h-12 w-12 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground text-center px-2">
              {page.fileName || 'File'}
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <h4 className="font-medium text-sm truncate mb-2" title={page.title}>
          {page.title || 'Untitled'}
        </h4>
        
        {/* Show additional properties (non-media fields) */}
        <div className="space-y-1">
          {Object.entries(page.properties)
            .filter(([fieldId, value]) => {
              const field = fields.find(f => f.id === fieldId);
              return value && field && !['image', 'file_attachment'].includes(field.type);
            })
            .slice(0, 2)
            .map(([fieldId, value]) => (
              <div key={fieldId} className="text-xs text-muted-foreground">
                <span className="font-medium">{getFieldName(fieldId)}:</span> {value}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
