
export type NavigationItemType = 'destination' | 'tool' | 'filter' | 'context';

export interface NavigationItem {
  id: string;
  type: NavigationItemType;
  label: string;
  purpose: string;
  scope: 'global' | 'workspace' | 'contextual';
  icon?: string;
  children?: NavigationItem[];
}

/**
 * Core Navigation Hierarchy Service
 * 
 * This service defines the fundamental purpose and relationship of top-level navigation items.
 * It establishes a clear mental model for users about how to interact with their content.
 */
export class NavigationHierarchyService {
  /**
   * The new hierarchy model clarifies:
   * 1. WORKSPACE (Destination) - Your content container and starting point
   * 2. SEARCH (Tool) - Universal discovery mechanism across all content
   * 3. INBOX (Filter) - Contextual view of items requiring attention
   */
  static getNavigationHierarchy(): NavigationItem[] {
    return [
      {
        id: 'workspace',
        type: 'destination',
        label: 'Workspace',
        purpose: 'Primary content container - your home base where all content lives',
        scope: 'workspace',
        children: [
          {
            id: 'pages',
            type: 'destination',
            label: 'Pages',
            purpose: 'Document-based content and notes',
            scope: 'workspace'
          },
          {
            id: 'databases',
            type: 'destination', 
            label: 'Databases',
            purpose: 'Structured data and collections',
            scope: 'workspace'
          },
          {
            id: 'templates',
            type: 'tool',
            label: 'Templates',
            purpose: 'Reusable content patterns and starting points',
            scope: 'workspace'
          }
        ]
      },
      {
        id: 'search',
        type: 'tool',
        label: 'Search',
        purpose: 'Universal discovery tool - find anything across all workspaces and content types',
        scope: 'global'
      },
      {
        id: 'inbox',
        type: 'filter',
        label: 'Inbox',
        purpose: 'Contextual filter showing content requiring attention (mentions, assignments, deadlines)',
        scope: 'contextual',
        children: [
          {
            id: 'mentions',
            type: 'filter',
            label: 'Mentions',
            purpose: 'Items where you are mentioned or tagged',
            scope: 'contextual'
          },
          {
            id: 'assignments',
            type: 'filter',
            label: 'Assignments',
            purpose: 'Tasks and items assigned to you',
            scope: 'contextual'
          },
          {
            id: 'deadlines',
            type: 'filter',
            label: 'Deadlines',
            purpose: 'Items with approaching or overdue dates',
            scope: 'contextual'
          }
        ]
      }
    ];
  }

  /**
   * Get the primary navigation flow based on user intent
   */
  static getNavigationFlow(userIntent: 'create' | 'find' | 'review' | 'organize'): NavigationItem {
    const hierarchy = this.getNavigationHierarchy();
    
    switch (userIntent) {
      case 'create':
        return hierarchy[0]; // Workspace - go to your content container
      case 'find':
        return hierarchy[1]; // Search - use the discovery tool
      case 'review':
        return hierarchy[2]; // Inbox - check what needs attention
      case 'organize':
        return hierarchy[0]; // Workspace - manage your content structure
      default:
        return hierarchy[0]; // Default to workspace
    }
  }

  /**
   * Validate that current navigation structure aligns with hierarchy principles
   */
  static validateNavigationStructure(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for clear separation of concerns
    const hierarchy = this.getNavigationHierarchy();
    const destinations = hierarchy.filter(item => item.type === 'destination');
    const tools = hierarchy.filter(item => item.type === 'tool');
    const filters = hierarchy.filter(item => item.type === 'filter');

    if (destinations.length === 0) {
      issues.push('No clear content destinations defined');
      recommendations.push('Define primary content containers (workspaces)');
    }

    if (tools.length === 0) {
      issues.push('No universal tools available');
      recommendations.push('Provide discovery tools like search');
    }

    if (filters.length === 0) {
      issues.push('No contextual filters for content prioritization');
      recommendations.push('Add inbox-style filters for actionable items');
    }

    // Check for proper scope definition
    const globalItems = hierarchy.filter(item => item.scope === 'global');
    if (globalItems.length === 0) {
      recommendations.push('Consider adding global tools that work across all workspaces');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}

export const navigationHierarchy = NavigationHierarchyService.getNavigationHierarchy();
