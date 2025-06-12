
import { BasePropertyConfig } from '../base';

export interface FileAttachmentPropertyConfig extends BasePropertyConfig {
  allowedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  allowedExtensions?: string[];
  displayAs?: 'list' | 'gallery' | 'table';
}
