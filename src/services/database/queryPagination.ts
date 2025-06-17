
export class DatabaseQueryPagination {
  static calculatePaginationMeta(page: number, limit: number, totalCount: number) {
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage: page,
      itemsPerPage: limit,
      totalItems: totalCount
    };
  }

  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static getPageFromOffset(offset: number, limit: number): number {
    return Math.floor(offset / limit) + 1;
  }
}
