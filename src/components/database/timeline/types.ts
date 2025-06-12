
export interface TimelineItem {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  properties: Record<string, string>;
  pageId: string;
}

export interface TimelineGroup {
  date: Date;
  items: TimelineItem[];
}

export type TimelineViewMode = 'day' | 'week' | 'month';

export interface TimelineViewProps {
  databaseId: string;
  workspaceId: string;
  fields: any[];
  filters: any[];
  sortRules: any[];
}
