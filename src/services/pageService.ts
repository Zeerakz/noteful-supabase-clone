
import { fetchPages, fetchDatabasePages, getPageProperties } from './pageQueryService';
import { createPage, updatePage, deletePage } from './pageMutationService';
import type { PageCreateRequest, PageUpdateRequest } from './pageMutationService';

// This class now acts as a facade, delegating to the more specific services.
// This maintains a consistent API for the rest of the app, avoiding breaking changes.
export class PageService {
  static fetchPages = fetchPages;
  static fetchDatabasePages = fetchDatabasePages;
  static getPageProperties = getPageProperties;
  static createPage = createPage;
  static updatePage = updatePage;
  static deletePage = deletePage;
}

// Re-export types so consumers of PageService don't break.
export type { PageCreateRequest, PageUpdateRequest };
