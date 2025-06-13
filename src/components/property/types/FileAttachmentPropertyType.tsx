
import React from 'react';
import { Paperclip } from 'lucide-react';
import { FileAttachmentPropertyConfig } from '@/types/property';
import { PropertyTypeDefinition } from '@/types/propertyRegistry';
import { FileAttachmentPropertyConfigEditor } from '../config-editors/FileAttachmentPropertyConfigEditor';
import { FileAttachmentFieldDisplay } from '../field-displays/FileAttachmentFieldDisplay';
import { FileAttachmentFieldEditor } from '../field-editors/FileAttachmentFieldEditor';

export const fileAttachmentPropertyType: PropertyTypeDefinition<FileAttachmentPropertyConfig> = {
  type: 'file_attachment',
  label: 'File & Media',
  description: 'Upload and attach files or media',
  icon: <Paperclip className="h-4 w-4" />,
  category: 'media',
  
  getDefaultConfig: () => ({
    required: false,
    displayAs: 'list',
    maxFiles: undefined,
    maxFileSize: undefined,
    allowedTypes: [],
    allowedExtensions: [],
  }),
  
  validateConfig: (config: FileAttachmentPropertyConfig) => {
    const errors: string[] = [];
    
    if (config.maxFiles && config.maxFiles < 1) {
      errors.push('Maximum files must be at least 1');
    }
    
    if (config.maxFileSize && config.maxFileSize < 1024) {
      errors.push('Maximum file size must be at least 1KB');
    }
    
    if (config.displayAs && !['list', 'gallery', 'table'].includes(config.displayAs)) {
      errors.push('Display mode must be list, gallery, or table');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  getDefaultValue: () => {
    return '';
  },
  
  validateValue: (value: any, config: FileAttachmentPropertyConfig) => {
    const errors: string[] = [];
    
    if (config.required && (!value || value.trim() === '')) {
      errors.push('This field is required');
    }
    
    // Value should be a JSON string of file IDs or empty
    if (value && value.trim()) {
      try {
        const fileIds = JSON.parse(value);
        if (!Array.isArray(fileIds)) {
          errors.push('Invalid file data format');
        } else if (config.maxFiles && fileIds.length > config.maxFiles) {
          errors.push(`Maximum ${config.maxFiles} files allowed`);
        }
      } catch {
        errors.push('Invalid file data format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  formatValue: (value: any, config: FileAttachmentPropertyConfig) => {
    if (!value || value.trim() === '') return 'No files';
    
    try {
      const fileIds = JSON.parse(value);
      if (Array.isArray(fileIds)) {
        const count = fileIds.length;
        return `${count} file${count !== 1 ? 's' : ''}`;
      }
    } catch {
      // Fallback for malformed data
    }
    
    return 'Files attached';
  },
  
  parseValue: (input: string) => {
    return input.trim();
  },
  
  ConfigEditor: FileAttachmentPropertyConfigEditor,
  FieldDisplay: FileAttachmentFieldDisplay,
  FieldEditor: FileAttachmentFieldEditor,
  
  supportsFiltering: false,
  supportsSorting: false,
  supportsGrouping: false,
};
