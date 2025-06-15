
import { BasePropertyConfig } from '../base';
import { ComplexFilter } from '@/types/filters';

export interface ButtonAction {
  id: string;
  type: 'create_page_with_template' | 'update_pages' | 'open_link';
  label: string;
  config: ButtonActionConfig;
}

export type ButtonActionConfig = 
  | CreatePageWithTemplateConfig
  | UpdatePagesConfig
  | OpenLinkConfig;

export interface CreatePageWithTemplateConfig {
  templateId: string;
  targetWorkspaceId?: string;
  pageName?: string;
  prefilledProperties?: { propertyId: string; value: string }[];
}

export interface UpdatePagesConfig {
  target: 'current_page' | 'filtered_pages';
  targetDatabaseId?: string;
  filter?: ComplexFilter;
  propertiesToUpdate: { propertyId: string; value: string }[];
}

export interface OpenLinkConfig {
  url: string;
  openInNewTab: boolean;
}

export interface ButtonPropertyConfig extends BasePropertyConfig {
  label: string;
  actions: ButtonAction[];
  variant: 'default' | 'outline' | 'ghost' | 'destructive';
  size: 'sm' | 'default' | 'lg';
  disabled?: boolean;
}
