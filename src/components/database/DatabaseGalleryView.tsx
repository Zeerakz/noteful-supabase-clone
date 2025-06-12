
import React, { useState, useEffect } from 'react';
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { GalleryViewHeader } from './gallery/GalleryViewHeader';
import { GalleryContent } from './gallery/GalleryContent';
import { GalleryEmptyState } from './gallery/GalleryEmptyState';
import { GalleryErrorState } from './gallery/GalleryErrorState';
import { GalleryLoadingState } from './gallery/GalleryLoadingState';
import { GalleryViewSettings } from './gallery/types';
import { useGalleryData } from './gallery/hooks/useGalleryData';
import { useGallerySelection } from './gallery/hooks/useGallerySelection';
import { useGalleryActions } from './gallery/hooks/useGalleryActions';

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
  const [settings, setSettings] = useState<GalleryViewSettings>(() => ({
    ...DEFAULT_SETTINGS,
    visibleProperties: fields.slice(0, 3).map(f => f.id),
    coverFieldId: fields.find(f => f.type === 'image' || f.type === 'file_attachment')?.id || null
  }));

  const {
    pagesWithProperties,
    mediaUrls,
    loading,
    error,
    refetch
  } = useGalleryData({
    databaseId,
    fields,
    filterGroup,
    sortRules,
    coverFieldId: settings.coverFieldId
  });

  const {
    selectedPages,
    handlePageSelect,
    handleSelectAll,
    handleClearSelection,
    handleBulkDelete
  } = useGallerySelection();

  const {
    handleCreateEntry,
    handlePageEdit,
    handlePageView,
    handlePageDelete
  } = useGalleryActions(workspaceId, databaseId);

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

  if (loading) {
    return <GalleryLoadingState cardSize={settings.cardSize} />;
  }

  if (error) {
    return <GalleryErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <GalleryViewHeader
        settings={settings}
        fields={fields}
        selectedCount={selectedPages.size}
        totalCount={pagesWithProperties.length}
        onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        onCreateEntry={() => handleCreateEntry(refetch)}
        onBulkDelete={() => handleBulkDelete(refetch)}
        onSelectAll={() => handleSelectAll(pagesWithProperties.map(p => p.id))}
        onClearSelection={handleClearSelection}
      />

      {pagesWithProperties.length === 0 ? (
        <GalleryEmptyState onCreateEntry={() => handleCreateEntry(refetch)} />
      ) : (
        <GalleryContent
          pagesWithProperties={pagesWithProperties}
          fields={fields}
          settings={settings}
          mediaUrls={mediaUrls}
          selectedPages={selectedPages}
          onPageSelect={handlePageSelect}
          onPageEdit={handlePageEdit}
          onPageView={handlePageView}
          onPageDelete={(pageId) => handlePageDelete(pageId, refetch)}
        />
      )}
    </div>
  );
}
