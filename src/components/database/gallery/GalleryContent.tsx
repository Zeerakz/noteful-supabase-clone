
import React from 'react';
import { cn } from '@/lib/utils';
import { DatabaseField } from '@/types/database';
import { GalleryCard } from './GalleryCard';
import { MasonryLayout } from './MasonryLayout';
import { PageWithProperties, GalleryViewSettings } from './types';

interface GalleryContentProps {
  pagesWithProperties: PageWithProperties[];
  fields: DatabaseField[];
  settings: GalleryViewSettings;
  mediaUrls: Record<string, string>;
  selectedPages: Set<string>;
  onPageSelect: (pageId: string, selected: boolean) => void;
  onPageEdit: (pageId: string) => void;
  onPageView: (pageId: string) => void;
  onPageDelete: (pageId: string) => void;
}

export function GalleryContent({
  pagesWithProperties,
  fields,
  settings,
  mediaUrls,
  selectedPages,
  onPageSelect,
  onPageEdit,
  onPageView,
  onPageDelete
}: GalleryContentProps) {
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

  const galleryCards = pagesWithProperties.map((page) => (
    <GalleryCard
      key={page.id}
      page={page}
      fields={fields}
      settings={settings}
      signedUrl={mediaUrls[page.id]}
      isSelected={selectedPages.has(page.id)}
      onSelect={(selected) => onPageSelect(page.id, selected)}
      onEdit={() => onPageEdit(page.id)}
      onView={() => onPageView(page.id)}
      onDelete={() => onPageDelete(page.id)}
    />
  ));

  if (settings.layout === 'masonry') {
    return (
      <MasonryLayout columns={settings.cardSize === 'large' ? 3 : settings.cardSize === 'medium' ? 4 : 6}>
        {galleryCards}
      </MasonryLayout>
    );
  }

  return (
    <div className={cn("grid gap-4", getGridColumns())}>
      {galleryCards}
    </div>
  );
}
