
import React from 'react';
import { RelationPropertyConfig } from '@/types/property';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDatabases } from '@/hooks/useDatabases';
import { Link, ArrowLeftRight, Search, Zap, AlertCircle } from 'lucide-react';

interface RelationPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: RelationPropertyConfig) => void;
  workspaceId?: string;
  currentDatabaseId?: string;
}

export function RelationPropertyConfigEditor({ 
  config, 
  onConfigChange, 
  workspaceId,
  currentDatabaseId 
}: RelationPropertyConfigEditorProps) {
  const relationConfig = config as RelationPropertyConfig;
  const { databases } = useDatabases(workspaceId);

  const updateConfig = (updates: Partial<RelationPropertyConfig>) => {
    onConfigChange({ ...relationConfig, ...updates });
  };

  // Check if this is a self-referencing relation
  const isSelfReferencing = relationConfig.targetDatabaseId === currentDatabaseId;

  const handleTargetDatabaseChange = (value: string) => {
    updateConfig({ 
      targetDatabaseId: value,
      // Reset backlink name if switching to/from self-referencing
      relatedPropertyName: value === currentDatabaseId ? 'Related items' : relationConfig.relatedPropertyName
    });
  };

  return (
    <div className="space-y-6">
      {/* Target Database Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link className="h-4 w-4" />
            Target Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetDatabase">Database to link to</Label>
            <Select 
              value={relationConfig.targetDatabaseId || ''} 
              onValueChange={handleTargetDatabaseChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a database to link to" />
              </SelectTrigger>
              <SelectContent>
                {databases?.map((database) => (
                  <SelectItem key={database.id} value={database.id}>
                    {database.name} {database.id === currentDatabaseId && '(This database)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {databases?.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No databases available. Create a database first to enable relations.
              </p>
            )}
          </div>

          {/* Self-referencing warning */}
          {isSelfReferencing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This relation will link to the same database. Be careful with bidirectional relations 
                to avoid creating circular references.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayProperty">Display Property</Label>
            <Input
              id="displayProperty"
              value={relationConfig.displayProperty || ''}
              onChange={(e) => updateConfig({ displayProperty: e.target.value })}
              placeholder="title"
            />
            <p className="text-xs text-muted-foreground">
              Which property from the target database to display (default: title)
            </p>
          </div>
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
              id="allowMultiple"
              checked={relationConfig.allowMultiple || false}
              onCheckedChange={(checked) => updateConfig({ allowMultiple: checked as boolean })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="allowMultiple" className="font-medium">
                Allow multiple relations
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable users to select multiple items from the target database
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="bidirectional"
              checked={relationConfig.bidirectional || false}
              onCheckedChange={(checked) => updateConfig({ bidirectional: checked as boolean })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="bidirectional" className="font-medium">
                Create bidirectional relationship
              </Label>
              <p className="text-xs text-muted-foreground">
                Show backlinks in the target database pointing back to this database
                {isSelfReferencing && ' (creates a reverse relation field in the same database)'}
              </p>
            </div>
          </div>

          {relationConfig.bidirectional && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="relatedPropertyName">Backlink Property Name</Label>
              <Input
                id="relatedPropertyName"
                value={relationConfig.relatedPropertyName || ''}
                onChange={(e) => updateConfig({ relatedPropertyName: e.target.value })}
                placeholder={isSelfReferencing ? "Related items" : "Related items"}
              />
              <p className="text-xs text-muted-foreground">
                Name for the reverse relationship property{isSelfReferencing ? ' in the same database' : ' in the target database'}
              </p>
              
              {isSelfReferencing && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Make sure the backlink property name is unique to avoid conflicts with existing fields.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Field Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="required"
              checked={relationConfig.required || false}
              onCheckedChange={(checked) => updateConfig({ required: checked as boolean })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="required" className="font-medium">
                Required field
              </Label>
              <p className="text-xs text-muted-foreground">
                Users must select at least one item
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Field Description</Label>
            <Textarea
              id="description"
              value={relationConfig.description || ''}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="Describe what this relation represents..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Help text shown to users when editing this field
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
