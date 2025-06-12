
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RelationFieldSettings, DatabaseField } from '@/types/database';
import { useDatabases } from '@/hooks/useDatabases';
import { DatabaseService } from '@/services/databaseService';

interface RelationFieldConfigProps {
  settings: RelationFieldSettings;
  onSettingsChange: (settings: RelationFieldSettings) => void;
  workspaceId: string;
}

export function RelationFieldConfig({ settings, onSettingsChange, workspaceId }: RelationFieldConfigProps) {
  const [targetDatabaseId, setTargetDatabaseId] = useState(settings.target_database_id || '');
  const [displayProperty, setDisplayProperty] = useState(settings.display_property || '');
  const [targetFields, setTargetFields] = useState<DatabaseField[]>([]);

  const { databases } = useDatabases(workspaceId);

  // Fetch fields for the target database when it changes
  useEffect(() => {
    const fetchTargetFields = async () => {
      if (!targetDatabaseId) {
        setTargetFields([]);
        return;
      }

      try {
        const { data, error } = await DatabaseService.fetchDatabaseFields(targetDatabaseId);
        if (error) throw new Error(error);
        setTargetFields(data || []);
      } catch (err) {
        console.error('Error fetching target database fields:', err);
        setTargetFields([]);
      }
    };

    fetchTargetFields();
  }, [targetDatabaseId]);

  useEffect(() => {
    onSettingsChange({
      target_database_id: targetDatabaseId,
      display_property: displayProperty,
    });
  }, [targetDatabaseId, displayProperty, onSettingsChange]);

  const handleTargetDatabaseChange = (value: string) => {
    setTargetDatabaseId(value);
    // Reset display property when database changes
    setDisplayProperty('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="target-database">Target Database</Label>
        <Select value={targetDatabaseId} onValueChange={handleTargetDatabaseChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a database to link to" />
          </SelectTrigger>
          <SelectContent>
            {databases.map((db) => (
              <SelectItem key={db.id} value={db.id}>
                {db.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {databases.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No databases available. Create a database first.
          </p>
        )}
      </div>

      {targetDatabaseId && (
        <div className="space-y-2">
          <Label htmlFor="display-property">Display Property</Label>
          <Select value={displayProperty} onValueChange={setDisplayProperty}>
            <SelectTrigger>
              <SelectValue placeholder="Select field to display" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              {targetFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose which field from the target database to display in the relation.
          </p>
        </div>
      )}
    </div>
  );
}
