
export interface PageWithProperties {
  pageId: string;
  title: string;
  properties: Record<string, string>;
  pos?: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  pages: PageWithProperties[];
}
