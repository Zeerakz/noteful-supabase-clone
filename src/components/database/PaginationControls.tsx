
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronFirst, ChevronLast } from 'lucide-react';

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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];

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
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    if (page === currentPage || isLoading) return;
    
    if (onGoToPage) {
      onGoToPage(page);
    } else if (page > currentPage) {
      onNextPage();
    } else if (page < currentPage) {
      onPrevPage();
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !isLoading) {
      onNextPage();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && !isLoading) {
      onPrevPage();
    }
  };

  const handleFirstPage = () => {
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
  };

  const handleLastPage = () => {
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
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {startIndex + 1}-{endIndex} of {totalItems} results
        </span>
        {onItemsPerPageChange && (
          <>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                if (!isLoading) {
                  onItemsPerPageChange(Number(value));
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </>
        )}
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFirstPage}
              disabled={currentPage === 1 || isLoading}
              className="gap-1"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
          </PaginationItem>
          
          <PaginationItem>
            <PaginationPrevious 
              onClick={handlePrevPage}
              className={`${
                currentPage === 1 || isLoading 
                  ? 'pointer-events-none opacity-50' 
                  : 'cursor-pointer'
              }`}
            />
          </PaginationItem>

          {getVisiblePages().map((page, index) => (
            <PaginationItem key={index}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(page as number)}
                  isActive={currentPage === page}
                  className={`cursor-pointer ${
                    isLoading ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext 
              onClick={handleNextPage}
              className={`${
                currentPage === totalPages || isLoading 
                  ? 'pointer-events-none opacity-50' 
                  : 'cursor-pointer'
              }`}
            />
          </PaginationItem>

          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLastPage}
              disabled={currentPage === totalPages || isLoading}
              className="gap-1"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
