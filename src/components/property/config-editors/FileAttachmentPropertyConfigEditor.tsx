
import React from 'react';
import { FileAttachmentPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface FileAttachmentPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: FileAttachmentPropertyConfig) => void;
}

export function FileAttachmentPropertyConfigEditor({ config, onConfigChange }: FileAttachmentPropertyConfigEditorProps) {
  const fileConfig = config as FileAttachmentPropertyConfig;

  const updateConfig = (updates: Partial<FileAttachmentPropertyConfig>) => {
    onConfigChange({ ...fileConfig, ...updates });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayAs">Display As</Label>
        <Select value={fileConfig.displayAs || 'list'} onValueChange={(value) => updateConfig({ displayAs: value as 'list' | 'gallery' | 'table' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List</SelectItem>
            <SelectItem value="gallery">Gallery</SelectItem>
            <SelectItem value="table">Table</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxFiles">Maximum Files</Label>
          <Input
            id="maxFiles"
            type="number"
            min="1"
            value={fileConfig.maxFiles || ''}
            onChange={(e) => updateConfig({ maxFiles: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Unlimited"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
          <Input
            id="maxFileSize"
            type="number"
            min="0.1"
            step="0.1"
            value={fileConfig.maxFileSize ? fileConfig.maxFileSize / (1024 * 1024) : ''}
            onChange={(e) => updateConfig({ 
              maxFileSize: e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined 
            })}
            placeholder="No limit"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowedTypes">Allowed MIME Types (one per line)</Label>
        <Textarea
          id="allowedTypes"
          value={(fileConfig.allowedTypes || []).join('\n')}
          onChange={(e) => updateConfig({ 
            allowedTypes: e.target.value.split('\n').filter(type => type.trim()).map(type => type.trim())
          })}
          placeholder="image/*&#10;application/pdf&#10;text/plain"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all file types. Use MIME types like image/*, application/pdf, etc.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowedExtensions">Allowed Extensions (one per line)</Label>
        <Textarea
          id="allowedExtensions"
          value={(fileConfig.allowedExtensions || []).join('\n')}
          onChange={(e) => updateConfig({ 
            allowedExtensions: e.target.value.split('\n').filter(ext => ext.trim()).map(ext => ext.trim().toLowerCase())
          })}
          placeholder=".jpg&#10;.png&#10;.pdf&#10;.docx"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all extensions. Include the dot (e.g., .jpg, .pdf).
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={fileConfig.required || false}
          onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={fileConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
