
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];

export function calculateDisplayInfo(
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  return { startIndex, endIndex };
}

export function getVisiblePages(currentPage: number, totalPages: number) {
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
}
