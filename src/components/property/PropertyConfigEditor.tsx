
import React from 'react';
import { Property, PropertyType, PropertyConfig, getDefaultConfigForType } from '@/types/property';
import { propertyRegistry } from '@/types/propertyRegistry';
import { RegistryBasedPropertyConfigEditor } from './RegistryBasedPropertyConfigEditor';
import { TextPropertyConfigEditor } from './config-editors/TextPropertyConfigEditor';
import { NumberPropertyConfigEditor } from './config-editors/NumberPropertyConfigEditor';
import { SelectPropertyConfigEditor } from './config-editors/SelectPropertyConfigEditor';
import { DatePropertyConfigEditor } from './config-editors/DatePropertyConfigEditor';
import { CheckboxPropertyConfigEditor } from './config-editors/CheckboxPropertyConfigEditor';
import { UrlPropertyConfigEditor } from './config-editors/UrlPropertyConfigEditor';
import { EmailPropertyConfigEditor } from './config-editors/EmailPropertyConfigEditor';
import { PhonePropertyConfigEditor } from './config-editors/PhonePropertyConfigEditor';
import { RelationPropertyConfigEditor } from './config-editors/RelationPropertyConfigEditor';
import { FormulaPropertyConfigEditor } from './config-editors/FormulaPropertyConfigEditor';
import { RollupPropertyConfigEditor } from './config-editors/RollupPropertyConfigEditor';
import { FileAttachmentPropertyConfigEditor } from './config-editors/FileAttachmentPropertyConfigEditor';
import { RichTextPropertyConfigEditor } from './config-editors/RichTextPropertyConfigEditor';
import { StatusPropertyConfigEditor } from './config-editors/StatusPropertyConfigEditor';
import { PeoplePropertyConfigEditor } from './config-editors/PeoplePropertyConfigEditor';
import { RatingPropertyConfigEditor } from './config-editors/RatingPropertyConfigEditor';
import { ProgressPropertyConfigEditor } from './config-editors/ProgressPropertyConfigEditor';
import { CurrencyPropertyConfigEditor } from './config-editors/CurrencyPropertyConfigEditor';

interface PropertyConfigEditorProps {
  propertyType: PropertyType;
  config: PropertyConfig;
  onConfigChange: (config: PropertyConfig) => void;
  workspaceId?: string;
  availableProperties?: Property[];
}

export function PropertyConfigEditor({
  propertyType,
  config,
  onConfigChange,
  workspaceId,
  availableProperties = []
}: PropertyConfigEditorProps) {
  // Ensure we have a valid config object
  const safeConfig = config || getDefaultConfigForType(propertyType);

  // First, check if the type is registered in the new registry
  if (propertyRegistry.has(propertyType)) {
    return (
      <RegistryBasedPropertyConfigEditor
        propertyType={propertyType}
        config={safeConfig}
        onConfigChange={onConfigChange}
        workspaceId={workspaceId}
        availableProperties={availableProperties}
      />
    );
  }

  // Fallback to existing hardcoded switch statement for backwards compatibility
  const renderConfigEditor = () => {
    switch (propertyType) {
      case 'text':
        return (
          <TextPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'number':
        return (
          <NumberPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'select':
      case 'multi_select':
        return (
          <SelectPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
            allowMultiple={propertyType === 'multi_select'}
          />
        );
      
      case 'date':
      case 'datetime':
        return (
          <DatePropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
            includeTime={propertyType === 'datetime'}
          />
        );
      
      case 'checkbox':
        return (
          <CheckboxPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'url':
        return (
          <UrlPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'email':
        return (
          <EmailPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'phone':
        return (
          <PhonePropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'relation':
        return (
          <RelationPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
            workspaceId={workspaceId}
          />
        );
      
      case 'formula':
        return (
          <FormulaPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
            availableProperties={availableProperties}
          />
        );
      
      case 'rollup':
        return (
          <RollupPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
            availableProperties={availableProperties}
          />
        );
      
      case 'file_attachment':
        return (
          <FileAttachmentPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'rich_text':
        return (
          <RichTextPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'status':
        return (
          <StatusPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'people':
        return (
          <PeoplePropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
            workspaceId={workspaceId}
          />
        );
      
      case 'rating':
        return (
          <RatingPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'progress':
        return (
          <ProgressPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      case 'currency':
        return (
          <CurrencyPropertyConfigEditor
            config={safeConfig}
            onConfigChange={onConfigChange}
          />
        );
      
      default:
        return (
          <div className="text-sm text-muted-foreground">
            No configuration options available for this property type.
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderConfigEditor()}
    </div>
  );
}
