
import { useState, useCallback } from 'react';

export function useDatabasePagination(initialItemsPerPage: number = 50) {
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  }, []);

  return {
    itemsPerPage,
    handleItemsPerPageChange,
  };
}
