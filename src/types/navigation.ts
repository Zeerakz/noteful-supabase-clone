
/**
 * Core Hierarchical Data Model for Navigation Tree
 * 
 * This model supports multi-level hierarchies with two distinct item types:
 * 1. Section Headers: Non-navigable organizational containers
 * 2. Page Items: Navigable content pages
 * 
 * The structure is designed for logical workflow organization rather than alphabetical sorting.
 */

export type NavigationItemType = 'section' | 'page';

export interface BaseNavigationItem {
  id: string;
  type: NavigationItemType;
  title: string;
  order_index: number;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Section Header: Non-navigable organizational container
 * Used for grouping related pages (e.g., "Teamspaces", "Private", "Projects")
 */
export interface NavigationSection extends BaseNavigationItem {
  type: 'section';
  /** Optional icon identifier for the section */
  icon?: string;
  /** Whether the section is expanded by default */
  is_expanded?: boolean;
  /** Optional description for the section */
  description?: string;
  /** Workspace context for the section */
  workspace_id: string;
  /** User who created this section */
  created_by: string;
}

/**
 * Page Item: Navigable content page
 * Represents actual pages that users can navigate to and edit
 */
export interface NavigationPage extends BaseNavigationItem {
  type: 'page';
  /** Reference to the actual page data */
  page_id: string;
  /** Workspace context for the page */
  workspace_id: string;
  /** User who created this page */
  created_by: string;
  /** Optional database reference if this page is part of a database */
  database_id?: string | null;
  /** Whether this page has been favorited by the user */
  is_favorited?: boolean;
  /** Last time this page was accessed by the current user */
  last_accessed?: string | null;
}

/**
 * Union type for all navigation items
 */
export type NavigationItem = NavigationSection | NavigationPage;

/**
 * Hierarchical tree structure for rendering
 */
export interface NavigationTreeNode {
  item: NavigationItem;
  children: NavigationTreeNode[];
  depth: number;
  /** Whether this node is currently expanded in the UI */
  isExpanded: boolean;
  /** Path from root to this node for breadcrumb navigation */
  path: string[];
}

/**
 * Configuration for different workspace navigation contexts
 */
export interface WorkspaceNavigationConfig {
  workspace_id: string;
  /** Default sections that should be created for new workspaces */
  default_sections: Omit<NavigationSection, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>[];
  /** Maximum nesting depth allowed */
  max_depth: number;
  /** Whether users can create custom sections */
  allow_custom_sections: boolean;
}

/**
 * Navigation tree operations interface
 */
export interface NavigationTreeOperations {
  /** Move an item to a new parent and position */
  moveItem: (itemId: string, newParentId: string | null, newIndex: number) => Promise<void>;
  /** Create a new section */
  createSection: (section: Omit<NavigationSection, 'id' | 'created_at' | 'updated_at'>) => Promise<NavigationSection>;
  /** Create a new page item */
  createPageItem: (pageItem: Omit<NavigationPage, 'id' | 'created_at' | 'updated_at'>) => Promise<NavigationPage>;
  /** Update an existing item */
  updateItem: (itemId: string, updates: Partial<NavigationItem>) => Promise<NavigationItem>;
  /** Delete an item and optionally its children */
  deleteItem: (itemId: string, deleteChildren?: boolean) => Promise<void>;
  /** Toggle section expansion state */
  toggleSection: (sectionId: string, isExpanded: boolean) => Promise<void>;
  /** Get full tree for a workspace */
  getNavigationTree: (workspaceId: string) => Promise<NavigationTreeNode[]>;
}

/**
 * Default workspace sections that are commonly used
 */
export const DEFAULT_WORKSPACE_SECTIONS: Omit<NavigationSection, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'updated_at'>[] = [
  {
    type: 'section',
    title: 'Getting Started',
    order_index: 0,
    icon: 'rocket',
    is_expanded: true,
    description: 'Quick start guides and templates',
  },
  {
    type: 'section',
    title: 'Projects',
    order_index: 1,
    icon: 'folder',
    is_expanded: true,
    description: 'Active project workspaces',
  },
  {
    type: 'section',
    title: 'Databases',
    order_index: 2,
    icon: 'database',
    is_expanded: false,
    description: 'Structured data collections',
  },
  {
    type: 'section',
    title: 'Archive',
    order_index: 3,
    icon: 'archive',
    is_expanded: false,
    description: 'Completed or archived content',
  },
];

/**
 * Utility functions for working with navigation trees
 */
export class NavigationTreeUtils {
  /**
   * Build a hierarchical tree from flat navigation items
   */
  static buildTree(items: NavigationItem[]): NavigationTreeNode[] {
    const itemMap = new Map<string, NavigationItem>();
    const children = new Map<string, NavigationItem[]>();

    // Build maps for efficient lookup
    items.forEach(item => {
      itemMap.set(item.id, item);
      if (!children.has(item.parent_id || 'root')) {
        children.set(item.parent_id || 'root', []);
      }
    });

    // Group items by parent
    items.forEach(item => {
      const parentKey = item.parent_id || 'root';
      if (!children.has(parentKey)) {
        children.set(parentKey, []);
      }
      children.get(parentKey)!.push(item);
    });

    // Sort children by order_index
    children.forEach(childList => {
      childList.sort((a, b) => a.order_index - b.order_index);
    });

    // Build tree recursively
    const buildNode = (item: NavigationItem, depth: number, path: string[]): NavigationTreeNode => {
      const childItems = children.get(item.id) || [];
      const nodePath = [...path, item.title];
      
      return {
        item,
        children: childItems.map(child => buildNode(child, depth + 1, nodePath)),
        depth,
        isExpanded: item.type === 'section' ? (item as NavigationSection).is_expanded ?? true : false,
        path: nodePath,
      };
    };

    // Get root items and build tree
    const rootItems = children.get('root') || [];
    return rootItems.map(item => buildNode(item, 0, []));
  }

  /**
   * Find an item in the tree by ID
   */
  static findItemInTree(tree: NavigationTreeNode[], itemId: string): NavigationTreeNode | null {
    for (const node of tree) {
      if (node.item.id === itemId) {
        return node;
      }
      const found = this.findItemInTree(node.children, itemId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Get all parent IDs for an item (path to root)
   */
  static getParentPath(items: NavigationItem[], itemId: string): string[] {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.parent_id) return [];
    
    return [...this.getParentPath(items, item.parent_id), item.parent_id];
  }

  /**
   * Validate that moving an item won't create a circular reference
   */
  static validateMove(items: NavigationItem[], itemId: string, newParentId: string | null): boolean {
    if (!newParentId) return true; // Moving to root is always valid
    
    // Check if newParentId is a descendant of itemId
    const descendants = this.getDescendantIds(items, itemId);
    return !descendants.includes(newParentId);
  }

  /**
   * Get all descendant IDs for an item
   */
  static getDescendantIds(items: NavigationItem[], parentId: string): string[] {
    const children = items.filter(item => item.parent_id === parentId);
    const descendants: string[] = [];
    
    children.forEach(child => {
      descendants.push(child.id);
      descendants.push(...this.getDescendantIds(items, child.id));
    });
    
    return descendants;
  }

  /**
   * Calculate the next order_index for a new item in a parent
   */
  static getNextOrderIndex(items: NavigationItem[], parentId: string | null): number {
    const siblings = items.filter(item => item.parent_id === parentId);
    return siblings.length > 0 ? Math.max(...siblings.map(s => s.order_index)) + 1 : 0;
  }
}
