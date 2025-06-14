
import { useState, useEffect, useMemo } from 'react';
import { DatabaseField } from '@/types/database';
import { useFilteredDatabasePagesQuery } from '@/hooks/useFilteredDatabasePagesQuery';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { getPublicUrl } from '@/utils/fileUtils';

interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, any>;
  coverUrl?: string;
}

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
  coverFieldId,
}: UseGalleryDataProps) {
  const { pages, loading, error, refetch } = useFilteredDatabasePagesQuery({
    databaseId,
    filterGroup,
    fields,
    sortRules,
  });

  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  const pagesWithProperties = useMemo<PageWithProperties[]>(() => {
    return pages.map((page) => ({
      id: page.id,
      title: page.title,
      properties: page.page_properties?.reduce((acc, prop) => {
        acc[prop.field_id] = prop.value;
        return acc;
      }, {} as Record<string, any>) || {},
    }));
  }, [pages]);

  useEffect(() => {
    if (coverFieldId) {
      const fetchMediaUrls = async () => {
        const urls: Record<string, string> = {};
        for (const page of pagesWithProperties) {
          const coverValue = page.properties[coverFieldId];
          if (coverValue && typeof coverValue === 'string') {
            try {
              const filePaths = JSON.parse(coverValue);
              if (Array.isArray(filePaths) && filePaths.length > 0) {
                const url = getPublicUrl(filePaths[0].path);
                if (url) {
                  urls[page.id] = url;
                }
              }
            } catch (e) {
              // Not a JSON array, treat as single path
              const url = getPublicUrl(coverValue);
              if (url) {
                urls[page.id] = url;
              }
            }
          }
        }
        setMediaUrls(urls);
      };

      fetchMediaUrls();
    }
  }, [pagesWithProperties, coverFieldId]);

  return {
    pagesWithProperties,
    mediaUrls,
    loading,
    error,
    refetch,
  };
}
