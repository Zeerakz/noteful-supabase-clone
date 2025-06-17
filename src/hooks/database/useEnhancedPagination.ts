
import { useState, useCallback, useEffect } from 'react';

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseEnhancedPaginationProps {
  enabled: boolean;
  initialPage: number;
  initialLimit: number;
}

export function useEnhancedPagination({
  enabled,
  initialPage,
  initialLimit
}: UseEnhancedPaginationProps) {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: initialPage,
    itemsPerPage: initialLimit,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const updatePaginationFromQuery = useCallback((queryResult: any) => {
    if (enabled && queryResult) {
      setPaginationState(prev => ({
        ...prev,
        totalItems: queryResult.totalCount || 0,
        totalPages: Math.ceil((queryResult.totalCount || 0) / prev.itemsPerPage),
        hasNextPage: queryResult.hasNextPage || false,
        hasPreviousPage: queryResult.hasPreviousPage || false,
      }));
    }
  }, [enabled]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= paginationState.totalPages) {
      setPaginationState(prev => ({ ...prev, currentPage: page }));
    }
  }, [paginationState.totalPages]);

  const nextPage = useCallback(() => {
    if (paginationState.hasNextPage) {
      goToPage(paginationState.currentPage + 1);
    }
  }, [paginationState.hasNextPage, paginationState.currentPage, goToPage]);

  const prevPage = useCallback(() => {
    if (paginationState.hasPreviousPage) {
      goToPage(paginationState.currentPage - 1);
    }
  }, [paginationState.hasPreviousPage, paginationState.currentPage, goToPage]);

  const changeItemsPerPage = useCallback((newLimit: number) => {
    setPaginationState(prev => ({
      ...prev,
      itemsPerPage: newLimit,
      currentPage: 1, // Reset to first page
      totalPages: Math.ceil(prev.totalItems / newLimit),
    }));
  }, []);

  return {
    paginationState,
    updatePaginationFromQuery,
    goToPage,
    nextPage,
    prevPage,
    changeItemsPerPage,
  };
}
