
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatabaseField } from '@/types/database';
import { PropertyType, FieldType } from '@/types/property';
import { RegistryBasedFieldTypeSelector } from '@/components/property/RegistryBasedFieldTypeSelector';
import { FieldConfigurationPanel } from './FieldConfigurationPanel';
import { FieldVisibilitySettings } from './FieldVisibilitySettings';

interface PropertyEditPanelProps {
  editingField: DatabaseField;
  fields: DatabaseField[];
  onFieldChange: (field: DatabaseField) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PropertyEditPanel({
  editingField,
  fields,
  onFieldChange,
  onSave,
  onCancel
}: PropertyEditPanelProps) {
  return (
    <div className="w-80">
      <h3 className="text-sm font-medium mb-4">Edit Property</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="field-name">Property Name</Label>
          <Input
            id="field-name"
            value={editingField.name}
            onChange={(e) => onFieldChange({ ...editingField, name: e.target.value })}
            placeholder="Enter property name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="field-type">Property Type</Label>
          <RegistryBasedFieldTypeSelector
            value={editingField.type as PropertyType}
            onValueChange={(type) => onFieldChange({ ...editingField, type: type as FieldType })}
            disabled={true}
          />
        </div>

        {/* Visibility Settings */}
        <FieldVisibilitySettings
          value={editingField.visibility_setting || 'show_when_not_empty'}
          onValueChange={(visibility_setting) => 
            onFieldChange({ ...editingField, visibility_setting })
          }
        />
        
        {/* Field Configuration */}
        <FieldConfigurationPanel
          fieldType={editingField.type as any}
          settings={editingField.settings}
          onSettingsChange={(settings) => onFieldChange({ ...editingField, settings })}
          availableFields={fields}
          workspaceId=""
        />
        
        <div className="flex gap-2 pt-4">
          <Button onClick={onSave} className="flex-1">
            Save Changes
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
