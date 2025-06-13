
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RelationFieldSettings, DatabaseField } from '@/types/database';
import { useDatabases } from '@/hooks/useDatabases';
import { DatabaseService } from '@/services/databaseService';
import { Link, ArrowLeftRight, Settings } from 'lucide-react';

interface RelationFieldConfigProps {
  settings: RelationFieldSettings;
  onSettingsChange: (settings: RelationFieldSettings) => void;
  workspaceId: string;
}

export function RelationFieldConfig({ settings, onSettingsChange, workspaceId }: RelationFieldConfigProps) {
  const [targetDatabaseId, setTargetDatabaseId] = useState(settings.target_database_id || '');
  const [displayProperty, setDisplayProperty] = useState(settings.display_property || 'title');
  const [allowMultiple, setAllowMultiple] = useState(settings.allow_multiple || false);
  const [bidirectional, setBidirectional] = useState(settings.bidirectional || false);
  const [relatedPropertyName, setRelatedPropertyName] = useState(settings.related_property_name || '');
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
      allow_multiple: allowMultiple,
      bidirectional: bidirectional,
      related_property_name: relatedPropertyName,
    });
  }, [targetDatabaseId, displayProperty, allowMultiple, bidirectional, relatedPropertyName, onSettingsChange]);

  const handleTargetDatabaseChange = (value: string) => {
    setTargetDatabaseId(value);
    // Reset display property when database changes
    setDisplayProperty('title');
  };

  return (
    <div className="space-y-6">
      {/* Target Database */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link className="h-4 w-4" />
            Target Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-database">Database to link to</Label>
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
        </CardContent>
      </Card>

      {/* Relationship Behavior */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Relationship Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="allow-multiple"
              checked={allowMultiple}
              onCheckedChange={setAllowMultiple}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="allow-multiple" className="font-medium">
                Allow multiple relations
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable selecting multiple items from the target database
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="bidirectional"
              checked={bidirectional}
              onCheckedChange={setBidirectional}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="bidirectional" className="font-medium">
                Create bidirectional relationship
              </Label>
              <p className="text-xs text-muted-foreground">
                Show backlinks in the target database
              </p>
            </div>
          </div>

          {bidirectional && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="related-property-name">Backlink Property Name</Label>
              <Input
                id="related-property-name"
                value={relatedPropertyName}
                onChange={(e) => setRelatedPropertyName(e.target.value)}
                placeholder="Related items"
              />
              <p className="text-xs text-muted-foreground">
                Name for the reverse relationship property
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
