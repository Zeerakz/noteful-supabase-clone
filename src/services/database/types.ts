
import { DatabaseField } from '@/types/database';
import { FilterGroup } from '@/types/filters';
import { SortRule } from '@/components/database/SortingModal';
import { Block } from '@/types/block';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface QueryResult {
  data: Block[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  enableCounting?: boolean;
}

export interface DatabaseQueryParams {
  databaseId: string;
  filterGroup: FilterGroup;
  fields: DatabaseField[];
  sortRules: SortRule[];
  userId?: string;
  options?: QueryOptions;
}

export interface DatabaseQueryResponse {
  data: Block[] | null;
  error: string | null;
  totalCount?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}
