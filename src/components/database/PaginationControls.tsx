
import React from 'react';
import { PaginationInfo } from './pagination/PaginationInfo';
import { PaginationNavigation } from './pagination/PaginationNavigation';
import { usePaginationHandlers } from './pagination/usePaginationHandlers';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToPage?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  isLoading?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onNextPage,
  onPrevPage,
  onGoToPage,
  onItemsPerPageChange,
  isLoading = false
}: PaginationControlsProps) {
  const {
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handleLastPage,
  } = usePaginationHandlers({
    currentPage,
    totalPages,
    onNextPage,
    onPrevPage,
    onGoToPage,
    isLoading
  });

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-2">
      <PaginationInfo
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={onItemsPerPageChange}
        isLoading={isLoading}
      />

      <PaginationNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onFirstPage={handleFirstPage}
        onLastPage={handleLastPage}
        isLoading={isLoading}
      />
    </div>
  );
}
