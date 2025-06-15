
import { BasePropertyConfig } from '../base';

export interface ButtonAction {
  id: string;
  type: 'create_page_with_template' | 'set_property_value' | 'open_link';
  label: string;
  config: ButtonActionConfig;
}

export type ButtonActionConfig = 
  | CreatePageWithTemplateConfig
  | SetPropertyValueConfig
  | OpenLinkConfig;

export interface CreatePageWithTemplateConfig {
  templateId: string;
  targetWorkspaceId?: string;
  pageName?: string;
  prefilledProperties?: { propertyId: string; value: string }[];
}

export interface SetPropertyValueConfig {
  targetFieldId: string;
  value: string;
  targetPageId?: string; // If not provided, applies to current page
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
