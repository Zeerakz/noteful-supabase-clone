
import { useCallback, useEffect, useRef } from 'react';
import { useNavigationState } from '@/contexts/NavigationStateContext';

interface TreeItem {
  id: string;
  parentId?: string | null;
  hasChildren: boolean;
  isExpanded: boolean;
  level: number;
}

interface UseEnhancedTreeViewNavigationProps {
  items: TreeItem[];
  onNavigate: (itemId: string) => void;
  onActivate: (itemId: string) => void;
}

export function useEnhancedTreeViewNavigation({
  items,
  onNavigate,
  onActivate,
}: UseEnhancedTreeViewNavigationProps) {
  const {
    state,
    setFocusedItem,
    setCurrentItem,
    toggleExpanded,
    isFocused,
    isCurrent,
    isExpanded,
  } = useNavigationState();

  const containerRef = useRef<HTMLElement>(null);

  // Get visible items (items that are shown in the UI based on expansion state)
  const getVisibleItems = useCallback(() => {
    const visibleItems: TreeItem[] = [];
    
    const addItemAndChildren = (item: TreeItem) => {
      // Update item expansion state from centralized state
      const itemWithState = {
        ...item,
        isExpanded: isExpanded(item.id),
      };
      
      visibleItems.push(itemWithState);
      
      if (itemWithState.isExpanded && itemWithState.hasChildren) {
        const children = items.filter(child => child.parentId === item.id);
        children.forEach(addItemAndChildren);
      }
    };

    // Start with root items (no parent)
    const rootItems = items.filter(item => !item.parentId);
    rootItems.forEach(addItemAndChildren);

    return visibleItems;
  }, [items, isExpanded]);

  // Find the next/previous visible item
  const getAdjacentItem = useCallback((currentId: string, direction: 'next' | 'previous') => {
    const visibleItems = getVisibleItems();
    const currentIndex = visibleItems.findIndex(item => item.id === currentId);
    
    if (currentIndex === -1) return null;

    if (direction === 'next') {
      return visibleItems[currentIndex + 1] || null;
    } else {
      return visibleItems[currentIndex - 1] || null;
    }
  }, [getVisibleItems]);

  // Get first child of an item
  const getFirstChild = useCallback((parentId: string) => {
    return items.find(item => item.parentId === parentId) || null;
  }, [items]);

  // Get parent of an item
  const getParent = useCallback((childId: string) => {
    const child = items.find(item => item.id === childId);
    if (!child?.parentId) return null;
    return items.find(item => item.id === child.parentId) || null;
  }, [items]);

  // Focus an item by ID and ensure proper ARIA state management
  const focusItem = useCallback((itemId: string) => {
    setFocusedItem(itemId);
    
    // Update DOM tabindex for roving tabindex pattern
    const element = containerRef.current?.querySelector(`[data-tree-item-id="${itemId}"]`) as HTMLElement;
    if (element) {
      const allTreeItems = containerRef.current?.querySelectorAll('[data-tree-item-id]') as NodeListOf<HTMLElement>;
      allTreeItems?.forEach(item => {
        item.tabIndex = item === element ? 0 : -1;
      });
      
      element.focus();
    }
  }, [setFocusedItem]);

  // Handle keyboard events with proper ARIA state management
  const handleKeyDown = useCallback((event: React.KeyboardEvent, currentItemId: string) => {
    const currentItem = items.find(item => item.id === currentItemId);
    if (!currentItem) return;

    const currentItemExpanded = isExpanded(currentItemId);

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextItem = getAdjacentItem(currentItemId, 'next');
        if (nextItem) {
          focusItem(nextItem.id);
        }
        break;
      }

      case 'ArrowUp': {
        event.preventDefault();
        const prevItem = getAdjacentItem(currentItemId, 'previous');
        if (prevItem) {
          focusItem(prevItem.id);
        }
        break;
      }

      case 'ArrowRight': {
        event.preventDefault();
        if (currentItem.hasChildren) {
          if (!currentItemExpanded) {
            // Expand the node
            toggleExpanded(currentItemId);
          } else {
            // Move to first child
            const firstChild = getFirstChild(currentItemId);
            if (firstChild) {
              focusItem(firstChild.id);
            }
          }
        }
        break;
      }

      case 'ArrowLeft': {
        event.preventDefault();
        if (currentItem.hasChildren && currentItemExpanded) {
          // Collapse the node
          toggleExpanded(currentItemId);
        } else {
          // Move to parent
          const parent = getParent(currentItemId);
          if (parent) {
            focusItem(parent.id);
          }
        }
        break;
      }

      case 'Enter':
      case ' ': {
        event.preventDefault();
        // Set as current item and activate
        setCurrentItem(currentItemId);
        onActivate(currentItemId);
        break;
      }

      case 'Home': {
        event.preventDefault();
        const visibleItems = getVisibleItems();
        if (visibleItems.length > 0) {
          focusItem(visibleItems[0].id);
        }
        break;
      }

      case 'End': {
        event.preventDefault();
        const visibleItems = getVisibleItems();
        if (visibleItems.length > 0) {
          focusItem(visibleItems[visibleItems.length - 1].id);
        }
        break;
      }
    }
  }, [
    items,
    isExpanded,
    getAdjacentItem,
    getFirstChild,
    getParent,
    focusItem,
    toggleExpanded,
    setCurrentItem,
    onActivate,
  ]);

  // Initialize focus on first item if none is focused
  useEffect(() => {
    if (!state.focusedItemId && items.length > 0) {
      const firstItem = items.find(item => !item.parentId);
      if (firstItem) {
        setFocusedItem(firstItem.id);
      }
    }
  }, [items, state.focusedItemId, setFocusedItem]);

  // Update tabindex when focused item changes
  useEffect(() => {
    if (state.focusedItemId && containerRef.current) {
      const allTreeItems = containerRef.current.querySelectorAll('[data-tree-item-id]') as NodeListOf<HTMLElement>;
      const focusedElement = containerRef.current.querySelector(`[data-tree-item-id="${state.focusedItemId}"]`) as HTMLElement;
      
      allTreeItems.forEach(item => {
        item.tabIndex = item === focusedElement ? 0 : -1;
      });
    }
  }, [state.focusedItemId]);

  return {
    focusedItemId: state.focusedItemId,
    currentItemId: state.currentItemId,
    containerRef,
    handleKeyDown,
    focusItem,
    isFocused,
    isCurrent,
    isExpanded,
    getVisibleItems,
  };
}
