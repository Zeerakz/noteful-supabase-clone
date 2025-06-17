
import { useCallback } from 'react';

interface UsePaginationHandlersProps {
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToPage?: (page: number) => void;
  isLoading?: boolean;
}

export function usePaginationHandlers({
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  onGoToPage,
  isLoading = false
}: UsePaginationHandlersProps) {
  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage || isLoading) return;
    
    if (onGoToPage) {
      onGoToPage(page);
    } else if (page > currentPage) {
      onNextPage();
    } else if (page < currentPage) {
      onPrevPage();
    }
  }, [currentPage, isLoading, onGoToPage, onNextPage, onPrevPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages && !isLoading) {
      onNextPage();
    }
  }, [currentPage, totalPages, isLoading, onNextPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1 && !isLoading) {
      onPrevPage();
    }
  }, [currentPage, isLoading, onPrevPage]);

  const handleFirstPage = useCallback(() => {
    if (currentPage > 1 && !isLoading) {
      if (onGoToPage) {
        onGoToPage(1);
      } else {
        // Fallback for legacy implementations
        for (let i = currentPage; i > 1; i--) {
          onPrevPage();
        }
      }
    }
  }, [currentPage, isLoading, onGoToPage, onPrevPage]);

  const handleLastPage = useCallback(() => {
    if (currentPage < totalPages && !isLoading) {
      if (onGoToPage) {
        onGoToPage(totalPages);
      } else {
        // Fallback for legacy implementations
        for (let i = currentPage; i < totalPages; i++) {
          onNextPage();
        }
      }
    }
  }, [currentPage, totalPages, isLoading, onGoToPage, onNextPage]);

  return {
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handleLastPage,
  };
}
