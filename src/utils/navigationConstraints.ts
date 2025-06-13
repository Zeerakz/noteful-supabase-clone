
/**
 * Navigation depth and nesting constraints
 * 
 * Enforces maximum nesting depth to maintain usability and visual clarity
 */

import { NavigationItem, NavigationTreeNode } from '@/types/navigation';
import { Page } from '@/types/page';

/**
 * Maximum allowed nesting depth (0-indexed)
 * Level 0: Top level items
 * Level 1: First nested level
 * Level 2: Second nested level (maximum allowed)
 */
export const MAX_NESTING_DEPTH = 2;

/**
 * Maximum visible nesting levels (1-indexed for user display)
 */
export const MAX_VISIBLE_LEVELS = 3;

/**
 * Check if a page can be nested under a parent based on depth constraints
 */
export function canNestPage(
  pages: Page[], 
  pageId: string, 
  newParentId: string | null
): { canNest: boolean; reason?: string; currentDepth?: number; maxDepth?: number } {
  if (!newParentId) {
    // Moving to root level is always allowed
    return { canNest: true };
  }

  const newParentDepth = calculatePageDepth(pages, newParentId);
  const newDepth = newParentDepth + 1;

  if (newDepth > MAX_NESTING_DEPTH) {
    return {
      canNest: false,
      reason: `Cannot nest beyond ${MAX_VISIBLE_LEVELS} levels deep`,
      currentDepth: newDepth + 1, // Convert to 1-indexed for display
      maxDepth: MAX_VISIBLE_LEVELS
    };
  }

  return { canNest: true };
}

/**
 * Calculate the current depth of a page in the hierarchy
 */
export function calculatePageDepth(pages: Page[], pageId: string): number {
  const page = pages.find(p => p.id === pageId);
  if (!page || !page.parent_page_id) {
    return 0;
  }

  return 1 + calculatePageDepth(pages, page.parent_page_id);
}

/**
 * Get all possible parent pages that respect depth constraints
 */
export function getValidParentPages(
  pages: Page[], 
  pageId: string
): Page[] {
  return pages.filter(page => {
    // Can't be a parent to itself
    if (page.id === pageId) return false;
    
    // Can't be a descendant (would create circular reference)
    if (isDescendant(pages, page.id, pageId)) return false;
    
    // Check depth constraints
    const { canNest } = canNestPage(pages, pageId, page.id);
    return canNest;
  });
}

/**
 * Check if a page is a descendant of another page
 */
export function isDescendant(pages: Page[], potentialDescendant: string, ancestorId: string): boolean {
  const descendant = pages.find(p => p.id === potentialDescendant);
  if (!descendant || !descendant.parent_page_id) {
    return false;
  }

  if (descendant.parent_page_id === ancestorId) {
    return true;
  }

  return isDescendant(pages, descendant.parent_page_id, ancestorId);
}

/**
 * Get visual depth indicators for UI display
 */
export function getDepthIndicators(depth: number): {
  indentLevel: number;
  showDepthWarning: boolean;
  isMaxDepth: boolean;
  canAddChildren: boolean;
} {
  return {
    indentLevel: Math.min(depth, MAX_NESTING_DEPTH),
    showDepthWarning: depth >= MAX_NESTING_DEPTH - 1,
    isMaxDepth: depth >= MAX_NESTING_DEPTH,
    canAddChildren: depth < MAX_NESTING_DEPTH
  };
}

/**
 * Validate a drag and drop operation against depth constraints
 */
export function validateDragAndDrop(
  pages: Page[],
  draggedPageId: string,
  targetParentId: string | null,
  targetIndex: number
): { isValid: boolean; error?: string } {
  const { canNest, reason } = canNestPage(pages, draggedPageId, targetParentId);
  
  if (!canNest) {
    return {
      isValid: false,
      error: reason || 'Cannot perform this operation'
    };
  }

  return { isValid: true };
}
