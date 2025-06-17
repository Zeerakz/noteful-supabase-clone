
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
import { Button } from '@/components/ui/button';
import { ChevronFirst, ChevronLast } from 'lucide-react';
import { getVisiblePages } from './paginationUtils';

interface PaginationNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  isLoading?: boolean;
}

export function PaginationNavigation({
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage,
  onFirstPage,
  onLastPage,
  isLoading = false
}: PaginationNavigationProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="outline"
            size="sm"
            onClick={onFirstPage}
            disabled={currentPage === 1 || isLoading}
            className="gap-1"
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
        </PaginationItem>
        
        <PaginationItem>
          <PaginationPrevious 
            onClick={onPrevPage}
            className={`${
              currentPage === 1 || isLoading 
                ? 'pointer-events-none opacity-50' 
                : 'cursor-pointer'
            }`}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => (
          <PaginationItem key={index}>
            {page === '...' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page as number)}
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
            onClick={onNextPage}
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
            onClick={onLastPage}
            disabled={currentPage === totalPages || isLoading}
            className="gap-1"
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
