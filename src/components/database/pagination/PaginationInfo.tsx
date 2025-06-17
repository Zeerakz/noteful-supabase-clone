
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAGE_SIZE_OPTIONS, calculateDisplayInfo } from './paginationUtils';

interface PaginationInfoProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  isLoading?: boolean;
}

export function PaginationInfo({
  currentPage,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
  isLoading = false
}: PaginationInfoProps) {
  const { startIndex, endIndex } = calculateDisplayInfo(currentPage, itemsPerPage, totalItems);

  return (
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
  );
}
