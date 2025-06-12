
import React from 'react';
import { RollupPropertyConfig, Property } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface RollupPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: RollupPropertyConfig) => void;
  availableProperties?: Property[];
}

export function RollupPropertyConfigEditor({ config, onConfigChange, availableProperties = [] }: RollupPropertyConfigEditorProps) {
  const rollupConfig = config as RollupPropertyConfig;

  const updateConfig = (updates: Partial<RollupPropertyConfig>) => {
    onConfigChange({ ...rollupConfig, ...updates });
  };

  const relationProperties = availableProperties.filter(prop => prop.type === 'relation');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="relationField">Relation Field</Label>
        <Select value={rollupConfig.relationFieldId || ''} onValueChange={(value) => updateConfig({ relationFieldId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a relation field" />
          </SelectTrigger>
          <SelectContent>
            {relationProperties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the relation field that connects to the target database.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetProperty">Target Property</Label>
        <Select value={rollupConfig.targetPropertyId || ''} onValueChange={(value) => updateConfig({ targetPropertyId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select target property" />
          </SelectTrigger>
          <SelectContent>
            {/* This would be populated based on the selected relation field's target database */}
            <SelectItem value="placeholder">Select relation field first</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the property from the related database to aggregate.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aggregation">Aggregation Function</Label>
        <Select value={rollupConfig.aggregation || 'count'} onValueChange={(value) => updateConfig({ aggregation: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count">Count</SelectItem>
            <SelectItem value="sum">Sum</SelectItem>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="min">Minimum</SelectItem>
            <SelectItem value="max">Maximum</SelectItem>
            <SelectItem value="earliest">Earliest (Date)</SelectItem>
            <SelectItem value="latest">Latest (Date)</SelectItem>
            <SelectItem value="unique">Count Unique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Aggregation Examples</Label>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div><strong>Count:</strong> Number of related records</div>
          <div><strong>Sum:</strong> Total of all number values</div>
          <div><strong>Average:</strong> Average of all number values</div>
          <div><strong>Min/Max:</strong> Smallest/largest value</div>
          <div><strong>Earliest/Latest:</strong> First/last date chronologically</div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={rollupConfig.description || ''}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Enter field description"
          rows={2}
        />
      </div>
    </div>
  );
}
