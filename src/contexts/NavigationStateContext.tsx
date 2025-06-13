
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// State structure for navigation accessibility
interface NavigationState {
  // Current focused item for roving tabindex
  focusedItemId: string | null;
  // Currently active/selected item (aria-current)
  currentItemId: string | null;
  // Expanded state for all expandable items (aria-expanded)
  expandedItems: Set<string>;
  // Track which workspace is currently active
  activeWorkspaceId: string | null;
}

// Actions for updating navigation state
type NavigationAction =
  | { type: 'SET_FOCUSED_ITEM'; itemId: string | null }
  | { type: 'SET_CURRENT_ITEM'; itemId: string | null }
  | { type: 'TOGGLE_EXPANDED'; itemId: string }
  | { type: 'SET_EXPANDED'; itemId: string; expanded: boolean }
  | { type: 'SET_ACTIVE_WORKSPACE'; workspaceId: string | null }
  | { type: 'RESET_STATE' };

// Reducer for navigation state updates
function navigationStateReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'SET_FOCUSED_ITEM':
      return {
        ...state,
        focusedItemId: action.itemId,
      };

    case 'SET_CURRENT_ITEM':
      return {
        ...state,
        currentItemId: action.itemId,
      };

    case 'TOGGLE_EXPANDED': {
      const newExpandedItems = new Set(state.expandedItems);
      if (newExpandedItems.has(action.itemId)) {
        newExpandedItems.delete(action.itemId);
      } else {
        newExpandedItems.add(action.itemId);
      }
      return {
        ...state,
        expandedItems: newExpandedItems,
      };
    }

    case 'SET_EXPANDED': {
      const newExpandedItems = new Set(state.expandedItems);
      if (action.expanded) {
        newExpandedItems.add(action.itemId);
      } else {
        newExpandedItems.delete(action.itemId);
      }
      return {
        ...state,
        expandedItems: newExpandedItems,
      };
    }

    case 'SET_ACTIVE_WORKSPACE':
      return {
        ...state,
        activeWorkspaceId: action.workspaceId,
      };

    case 'RESET_STATE':
      return {
        focusedItemId: null,
        currentItemId: null,
        expandedItems: new Set(),
        activeWorkspaceId: null,
      };

    default:
      return state;
  }
}

// Context interface for navigation state and actions
interface NavigationStateContextValue {
  state: NavigationState;
  setFocusedItem: (itemId: string | null) => void;
  setCurrentItem: (itemId: string | null) => void;
  toggleExpanded: (itemId: string) => void;
  setExpanded: (itemId: string, expanded: boolean) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
  resetState: () => void;
  // Convenience getters
  isFocused: (itemId: string) => boolean;
  isCurrent: (itemId: string) => boolean;
  isExpanded: (itemId: string) => boolean;
}

// Create the context
const NavigationStateContext = createContext<NavigationStateContextValue | null>(null);

// Initial state
const initialState: NavigationState = {
  focusedItemId: null,
  currentItemId: null,
  expandedItems: new Set(),
  activeWorkspaceId: null,
};

// Provider component
interface NavigationStateProviderProps {
  children: ReactNode;
}

export function NavigationStateProvider({ children }: NavigationStateProviderProps) {
  const [state, dispatch] = useReducer(navigationStateReducer, initialState);

  // Action creators
  const setFocusedItem = useCallback((itemId: string | null) => {
    dispatch({ type: 'SET_FOCUSED_ITEM', itemId });
  }, []);

  const setCurrentItem = useCallback((itemId: string | null) => {
    dispatch({ type: 'SET_CURRENT_ITEM', itemId });
  }, []);

  const toggleExpanded = useCallback((itemId: string) => {
    dispatch({ type: 'TOGGLE_EXPANDED', itemId });
  }, []);

  const setExpanded = useCallback((itemId: string, expanded: boolean) => {
    dispatch({ type: 'SET_EXPANDED', itemId, expanded });
  }, []);

  const setActiveWorkspace = useCallback((workspaceId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_WORKSPACE', workspaceId });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Convenience getters
  const isFocused = useCallback((itemId: string) => {
    return state.focusedItemId === itemId;
  }, [state.focusedItemId]);

  const isCurrent = useCallback((itemId: string) => {
    return state.currentItemId === itemId;
  }, [state.currentItemId]);

  const isExpanded = useCallback((itemId: string) => {
    return state.expandedItems.has(itemId);
  }, [state.expandedItems]);

  const contextValue: NavigationStateContextValue = {
    state,
    setFocusedItem,
    setCurrentItem,
    toggleExpanded,
    setExpanded,
    setActiveWorkspace,
    resetState,
    isFocused,
    isCurrent,
    isExpanded,
  };

  return (
    <NavigationStateContext.Provider value={contextValue}>
      {children}
    </NavigationStateContext.Provider>
  );
}

// Hook for consuming navigation state
export function useNavigationState() {
  const context = useContext(NavigationStateContext);
  if (!context) {
    throw new Error('useNavigationState must be used within a NavigationStateProvider');
  }
  return context;
}

// Hook for accessibility-specific navigation state
export function useNavigationAccessibility() {
  const {
    setFocusedItem,
    setCurrentItem,
    toggleExpanded,
    setExpanded,
    isFocused,
    isCurrent,
    isExpanded,
  } = useNavigationState();

  return {
    setFocusedItem,
    setCurrentItem,
    toggleExpanded,
    setExpanded,
    isFocused,
    isCurrent,
    isExpanded,
  };
}
