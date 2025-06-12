
export type GalleryCardSize = 'small' | 'medium' | 'large';

export interface GalleryViewSettings {
  cardSize: GalleryCardSize;
  coverFieldId: string | null;
  visibleProperties: string[];
  layout: 'grid' | 'masonry';
}

export interface PageWithProperties {
  id: string;
  title: string;
  properties: Record<string, string>;
  mediaUrl?: string;
  mediaType?: 'image' | 'file';
  fileName?: string;
}
