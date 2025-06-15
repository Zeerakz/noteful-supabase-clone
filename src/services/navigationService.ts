
import { supabase } from '@/integrations/supabase/client';
import { 
  NavigationItem, 
  NavigationSection, 
  NavigationPage, 
  NavigationTreeNode,
  NavigationTreeUtils,
  DEFAULT_WORKSPACE_SECTIONS
} from '@/types/navigation';
import { Block } from '@/types/block';

export class NavigationService {
  /**
   * Get all navigation items for a workspace
   */
  static async getNavigationItems(workspaceId: string): Promise<{ data: NavigationItem[] | null; error: string | null }> {
    try {
      // For now, we'll simulate navigation items based on existing pages
      // In a full implementation, you would have a separate navigation_items table
      const { data: pages, error: pagesError } = await supabase
        .from('blocks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'page')
        .order('pos', { ascending: true });

      if (pagesError) throw pagesError;

      // Convert pages to navigation items and add default sections
      const navigationItems: NavigationItem[] = [];

      // Add default sections for the workspace
      DEFAULT_WORKSPACE_SECTIONS.forEach((sectionConfig, index) => {
        const section: NavigationSection = {
          ...sectionConfig,
          id: `section-${workspaceId}-${index}`,
          workspace_id: workspaceId,
          created_by: '', // Would be set by the user creating the workspace
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        navigationItems.push(section);
      });

      // Convert pages to navigation page items
      if (pages) {
        const typedPages = pages as Block[];
        typedPages.forEach(page => {
          const navigationPage: NavigationPage = {
            id: `page-nav-${page.id}`,
            type: 'page',
            title: page.properties?.title || 'Untitled',
            order_index: page.pos,
            parent_id: page.parent_id ? `page-nav-${page.parent_id}` : 'section-' + workspaceId + '-1', // Default to Projects section
            page_id: page.id,
            workspace_id: page.workspace_id,
            created_by: page.created_by || '',
            database_id: page.properties?.database_id,
            created_at: page.created_time,
            updated_at: page.last_edited_time,
          };
          navigationItems.push(navigationPage);
        });
      }

      return { data: navigationItems, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch navigation items'
      };
    }
  }

  /**
   * Get navigation tree for a workspace
   */
  static async getNavigationTree(workspaceId: string): Promise<{ data: NavigationTreeNode[] | null; error: string | null }> {
    const { data: items, error } = await this.getNavigationItems(workspaceId);
    
    if (error || !items) {
      return { data: null, error };
    }

    try {
      const tree = NavigationTreeUtils.buildTree(items);
      return { data: tree, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to build navigation tree'
      };
    }
  }

  /**
   * Create a new navigation section
   */
  static async createSection(
    section: Omit<NavigationSection, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: NavigationSection | null; error: string | null }> {
    try {
      // In a full implementation, this would insert into a navigation_items table
      // For now, we'll return a simulated section
      const newSection: NavigationSection = {
        ...section,
        id: `section-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { data: newSection, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to create section'
      };
    }
  }

  /**
   * Move a navigation item to a new parent and position
   */
  static async moveNavigationItem(
    itemId: string,
    newParentId: string | null,
    newIndex: number,
    workspaceId: string
  ): Promise<{ error: string | null }> {
    try {
      // Get current navigation items to validate the move
      const { data: items, error: fetchError } = await this.getNavigationItems(workspaceId);
      
      if (fetchError || !items) {
        throw new Error(fetchError || 'Failed to fetch navigation items');
      }

      // Validate the move won't create circular references
      if (!NavigationTreeUtils.validateMove(items, itemId, newParentId)) {
        throw new Error('Invalid move: would create circular reference');
      }

      // For page navigation items, update the underlying page
      const item = items.find(i => i.id === itemId);
      if (item && item.type === 'page') {
        const navigationPage = item as NavigationPage;
        // Extract the actual page ID and update it
        // This would involve updating the pages table with new parent_page_id and order_index
        
        // For now, this is a placeholder for the actual implementation
        console.log('Would update page:', navigationPage.page_id, {
          parent_page_id: newParentId?.startsWith('page-nav-') 
            ? newParentId.replace('page-nav-', '') 
            : null,
          order_index: newIndex
        });
      }

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to move navigation item'
      };
    }
  }

  /**
   * Toggle section expansion state
   */
  static async toggleSectionExpansion(
    sectionId: string,
    isExpanded: boolean
  ): Promise<{ error: string | null }> {
    try {
      // In a full implementation, this would update the navigation_items table
      // For now, we'll store this in localStorage or session state
      const expansionKey = `section-expansion-${sectionId}`;
      localStorage.setItem(expansionKey, JSON.stringify(isExpanded));
      
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to toggle section expansion'
      };
    }
  }

  /**
   * Get section expansion state
   */
  static getSectionExpansionState(sectionId: string): boolean {
    try {
      const expansionKey = `section-expansion-${sectionId}`;
      const stored = localStorage.getItem(expansionKey);
      return stored ? JSON.parse(stored) : true; // Default to expanded
    } catch {
      return true; // Default to expanded on error
    }
  }
}
