
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RelationFieldSettings, DatabaseField } from '@/types/database';
import { useDatabases } from '@/hooks/useDatabases';
import { DatabaseService } from '@/services/databaseService';
import { Link, ArrowLeftRight, Settings, AlertCircle } from 'lucide-react';

interface RelationFieldConfigProps {
  settings: RelationFieldSettings;
  onSettingsChange: (settings: RelationFieldSettings) => void;
  workspaceId: string;
  currentDatabaseId?: string;
}

export function RelationFieldConfig({ 
  settings, 
  onSettingsChange, 
  workspaceId, 
  currentDatabaseId 
}: RelationFieldConfigProps) {
  const [targetDatabaseId, setTargetDatabaseId] = useState(settings.target_database_id || '');
  const [displayProperty, setDisplayProperty] = useState(settings.display_property || 'title');
  const [allowMultiple, setAllowMultiple] = useState(settings.allow_multiple || false);
  const [bidirectional, setBidirectional] = useState(settings.bidirectional || false);
  const [relatedPropertyName, setRelatedPropertyName] = useState(settings.related_property_name || '');
  const [targetFields, setTargetFields] = useState<DatabaseField[]>([]);
  const [existingRelationFields, setExistingRelationFields] = useState<DatabaseField[]>([]);

  const { databases } = useDatabases(workspaceId);

  // Check if this is a self-referencing relation
  const isSelfReferencing = targetDatabaseId === currentDatabaseId;

  // Fetch fields for the target database when it changes
  useEffect(() => {
    const fetchTargetFields = async () => {
      if (!targetDatabaseId) {
        setTargetFields([]);
        setExistingRelationFields([]);
        return;
      }

      try {
        const { data, error } = await DatabaseService.fetchDatabaseFields(targetDatabaseId);
        if (error) throw new Error(error);
        
        const fields = data || [];
        setTargetFields(fields);
        
        // Find existing relation fields that might cause conflicts
        const relationFields = fields.filter(field => {
          if (field.type !== 'relation') return false;
          const fieldSettings = field.settings as RelationFieldSettings | null;
          return fieldSettings?.target_database_id === currentDatabaseId;
        });
        setExistingRelationFields(relationFields);
      } catch (err) {
        console.error('Error fetching target database fields:', err);
        setTargetFields([]);
        setExistingRelationFields([]);
      }
    };

    fetchTargetFields();
  }, [targetDatabaseId, currentDatabaseId]);

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
    
    // For self-referencing relations, suggest a different default name
    if (value === currentDatabaseId && !relatedPropertyName) {
      setRelatedPropertyName('Related items');
    }
  };

  const handleAllowMultipleChange = (checked: boolean | "indeterminate") => {
    setAllowMultiple(checked === true);
  };

  const handleBidirectionalChange = (checked: boolean | "indeterminate") => {
    setBidirectional(checked === true);
  };

  // Check for potential conflicts with existing backlink fields
  const hasConflictingBacklinks = isSelfReferencing && 
    bidirectional && 
    existingRelationFields.some(field => {
      const fieldSettings = field.settings as RelationFieldSettings | null;
      return fieldSettings?.related_property_name === relatedPropertyName ||
             field.name === relatedPropertyName;
    });

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
                    {db.name} {db.id === currentDatabaseId && '(This database)'}
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

          {/* Self-referencing warning */}
          {isSelfReferencing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This relation will link to the same database. Be careful with bidirectional relations 
                to avoid creating circular references or duplicate backlink columns.
              </AlertDescription>
            </Alert>
          )}

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
              onCheckedChange={handleAllowMultipleChange}
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
              onCheckedChange={handleBidirectionalChange}
              disabled={isSelfReferencing && hasConflictingBacklinks}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="bidirectional" className="font-medium">
                Create bidirectional relationship
              </Label>
              <p className="text-xs text-muted-foreground">
                Show backlinks in the target database
                {isSelfReferencing && ' (creates a reverse relation field)'}
              </p>
            </div>
          </div>

          {/* Conflict warning for self-referencing relations */}
          {hasConflictingBacklinks && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A backlink field with this name already exists. This could create duplicate 
                or conflicting relation fields. Choose a different backlink property name.
              </AlertDescription>
            </Alert>
          )}

          {bidirectional && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="related-property-name">Backlink Property Name</Label>
              <Input
                id="related-property-name"
                value={relatedPropertyName}
                onChange={(e) => setRelatedPropertyName(e.target.value)}
                placeholder={isSelfReferencing ? "Related items" : "Related items"}
                className={hasConflictingBacklinks ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Name for the reverse relationship property
                {isSelfReferencing && ' (will be created in the same database)'}
              </p>
              
              {/* Show existing relation fields for context */}
              {isSelfReferencing && existingRelationFields.length > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <p className="font-medium mb-1">Existing relation fields:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {existingRelationFields.map((field) => {
                      const fieldSettings = field.settings as RelationFieldSettings | null;
                      return (
                        <li key={field.id}>
                          {field.name} → {fieldSettings?.related_property_name || 'unnamed backlink'}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
