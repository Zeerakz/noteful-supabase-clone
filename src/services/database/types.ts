
export interface DatabaseQueryParams {
  databaseId: string;
  filterGroup: any;
  fields: any[];
  sortRules: any[];
  userId?: string;
  options?: {
    pagination?: {
      page: number;
      limit: number;
    };
    enableCounting?: boolean;
  };
}

export interface DatabaseQueryResponse {
  data: any[] | null;
  error: string | null;
  totalCount?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}
