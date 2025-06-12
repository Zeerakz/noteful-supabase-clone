
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilteredDatabasePages } from '@/hooks/useFilteredDatabasePages';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { supabase } from '@/integrations/supabase/client';
import { PageWithProperties } from '../types';

interface UseGalleryDataProps {
  databaseId: string;
  fields: DatabaseField[];
  filterGroup: FilterGroup;
  sortRules: SortRule[];
  coverFieldId: string | null;
}

export function useGalleryData({
  databaseId,
  fields,
  filterGroup,
  sortRules,
  coverFieldId
}: UseGalleryDataProps) {
  const { user } = useAuth();
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

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

  // Transform pages data and identify media
  const pagesWithProperties: PageWithProperties[] = useMemo(() => {
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

      if (coverFieldId) {
        const value = properties[coverFieldId];
        if (value) {
          const field = fields.find(f => f.id === coverFieldId);
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
  }, [pages, fields, coverFieldId]);

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

  return {
    pagesWithProperties,
    mediaUrls,
    loading: pagesLoading,
    error: pagesError,
    refetch: refetchPages
  };
}
