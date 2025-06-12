
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RollupFieldSettings, DatabaseField } from '@/types/database';
import { useDatabases } from '@/hooks/useDatabases';

interface RollupFieldConfigProps {
  settings: RollupFieldSettings;
  onSettingsChange: (settings: RollupFieldSettings) => void;
  availableFields: DatabaseField[];
  workspaceId: string;
}

export function RollupFieldConfig({ settings, onSettingsChange, availableFields, workspaceId }: RollupFieldConfigProps) {
  const [relationFieldId, setRelationFieldId] = useState(settings.relation_field_id || '');
  const [rollupProperty, setRollupProperty] = useState(settings.rollup_property || '');
  const [aggregation, setAggregation] = useState(settings.aggregation || 'count');
  const [targetDatabaseId, setTargetDatabaseId] = useState(settings.target_database_id || '');

  const { databases } = useDatabases(workspaceId);

  // Filter for relation fields only
  const relationFields = availableFields.filter(field => field.type === 'relation');

  useEffect(() => {
    onSettingsChange({
      relation_field_id: relationFieldId,
      rollup_property: rollupProperty,
      aggregation: aggregation as any,
      target_database_id: targetDatabaseId,
    });
  }, [relationFieldId, rollupProperty, aggregation, targetDatabaseId]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="relation-field">Relation Field</Label>
        <Select value={relationFieldId} onValueChange={setRelationFieldId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a relation field" />
          </SelectTrigger>
          <SelectContent>
            {relationFields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                {field.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {relationFields.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No relation fields available. Create a relation field first.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-database">Target Database</Label>
        <Select value={targetDatabaseId} onValueChange={setTargetDatabaseId}>
          <SelectTrigger>
            <SelectValue placeholder="Select target database" />
          </SelectTrigger>
          <SelectContent>
            {databases.map((db) => (
              <SelectItem key={db.id} value={db.id}>
                {db.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rollup-property">Property to Rollup</Label>
        <Select value={rollupProperty} onValueChange={setRollupProperty}>
          <SelectTrigger>
            <SelectValue placeholder="Select property to aggregate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count">Count of records</SelectItem>
            {/* In a real implementation, you'd fetch fields from the target database */}
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aggregation">Aggregation</Label>
        <Select value={aggregation} onValueChange={setAggregation}>
          <SelectTrigger>
            <SelectValue placeholder="Select aggregation method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count">Count</SelectItem>
            <SelectItem value="sum">Sum</SelectItem>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="min">Minimum</SelectItem>
            <SelectItem value="max">Maximum</SelectItem>
            <SelectItem value="earliest">Earliest</SelectItem>
            <SelectItem value="latest">Latest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
