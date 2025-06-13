
import { useState } from 'react';

export interface DatabaseView {
  id: string;
  name: string;
  type: 'table' | 'list' | 'timeline' | 'calendar' | 'kanban' | 'form' | 'gallery';
  filters?: any;
  sorts?: any;
  grouping?: any;
}

export function useDatabaseViews(databaseId: string) {
  const [views, setViews] = useState<DatabaseView[]>([]);

  const createView = async (viewData: Omit<DatabaseView, 'id'>) => {
    const newView: DatabaseView = {
      id: Math.random().toString(36).substr(2, 9),
      ...viewData
    };
    setViews(prev => [...prev, newView]);
    return newView;
  };

  const updateView = async (viewId: string, updates: Partial<DatabaseView>) => {
    setViews(prev => prev.map(view => 
      view.id === viewId ? { ...view, ...updates } : view
    ));
  };

  const deleteView = async (viewId: string) => {
    setViews(prev => prev.filter(view => view.id !== viewId));
  };

  return {
    views,
    createView,
    updateView,
    deleteView
  };
}
