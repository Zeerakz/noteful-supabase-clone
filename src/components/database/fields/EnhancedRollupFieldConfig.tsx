
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RollupFieldSettings, DatabaseField, RelationFieldSettings, FieldType } from '@/types/database';
import { DatabaseFieldService } from '@/services/database/databaseFieldService';
import { Calculator, Link, Target, AlertCircle } from 'lucide-react';

interface EnhancedRollupFieldConfigProps {
  settings: RollupFieldSettings;
  onSettingsChange: (settings: RollupFieldSettings) => void;
  availableFields: DatabaseField[];
  workspaceId: string;
}

type AggregationType = 'sum' | 'count' | 'average' | 'min' | 'max' | 'earliest' | 'latest';

interface PropertyOption {
  id: string;
  name: string;
  type: FieldType | 'system';
}

export function EnhancedRollupFieldConfig({ 
  settings, 
  onSettingsChange, 
  availableFields, 
  workspaceId 
}: EnhancedRollupFieldConfigProps) {
  const [relationFieldId, setRelationFieldId] = useState(settings.relation_field_id || '');
  const [rollupProperty, setRollupProperty] = useState(settings.rollup_property || '');
  const [aggregation, setAggregation] = useState<AggregationType>(settings.aggregation || 'count');
  const [targetDatabaseId, setTargetDatabaseId] = useState(settings.target_database_id || '');
  const [targetProperties, setTargetProperties] = useState<PropertyOption[]>([]);
  const [selectedRelationField, setSelectedRelationField] = useState<DatabaseField | null>(null);

  // Filter for relation fields only
  const relationFields = availableFields.filter(field => field.type === 'relation');

  // Fetch target database properties when relation field changes
  useEffect(() => {
    const fetchTargetProperties = async () => {
      if (!relationFieldId) {
        setTargetProperties([]);
        setSelectedRelationField(null);
        setTargetDatabaseId('');
        return;
      }

      const relationField = relationFields.find(field => field.id === relationFieldId);
      if (!relationField) return;

      setSelectedRelationField(relationField);
      const relationSettings = relationField.settings as RelationFieldSettings | null;
      const targetDbId = relationSettings?.target_database_id;
      
      if (!targetDbId) {
        setTargetProperties([]);
        return;
      }

      setTargetDatabaseId(targetDbId);

      try {
        const { data, error } = await DatabaseFieldService.fetchDatabaseFields(targetDbId);
        if (error) throw new Error(error.message);
        const fields = data as DatabaseField[];

        const properties: PropertyOption[] = [
          // Built-in system properties
          { id: 'count', name: 'Count of records', type: 'system' },
          // Database fields
          ...(fields || []).map(field => ({
            id: field.id,
            name: field.name,
            type: field.type
          }))
        ];

        setTargetProperties(properties);
      } catch (err) {
        console.error('Error fetching target database fields:', err);
        setTargetProperties([]);
      }
    };

    fetchTargetProperties();
  }, [relationFieldId, relationFields]);

  // Update settings whenever values change
  useEffect(() => {
    onSettingsChange({
      relation_field_id: relationFieldId,
      rollup_property: rollupProperty,
      aggregation: aggregation,
      target_database_id: targetDatabaseId,
    });
  }, [relationFieldId, rollupProperty, aggregation, targetDatabaseId, onSettingsChange]);

  const handleAggregationChange = (value: string) => {
    setAggregation(value as AggregationType);
  };

  const handleRelationFieldChange = (value: string) => {
    setRelationFieldId(value);
    // Reset rollup property when relation changes
    setRollupProperty('');
  };

  const handleRollupPropertyChange = (value: string) => {
    setRollupProperty(value);
  };

  // Get available aggregations based on selected property type
  const getAvailableAggregations = (propertyType: PropertyOption['type']): { value: AggregationType; label: string; description: string }[] => {
    const allAggregations = [
      { value: 'count' as AggregationType, label: 'Count', description: 'Count the number of related records' },
      { value: 'sum' as AggregationType, label: 'Sum', description: 'Add up all numeric values' },
      { value: 'average' as AggregationType, label: 'Average', description: 'Calculate the average of numeric values' },
      { value: 'min' as AggregationType, label: 'Minimum', description: 'Find the smallest value' },
      { value: 'max' as AggregationType, label: 'Maximum', description: 'Find the largest value' },
      { value: 'earliest' as AggregationType, label: 'Earliest', description: 'Find the earliest date' },
      { value: 'latest' as AggregationType, label: 'Latest', description: 'Find the latest date' }
    ];

    // Filter aggregations based on property type
    switch (propertyType) {
      case 'number':
      case 'currency':
      case 'progress':
        return allAggregations.filter(agg => ['count', 'sum', 'average', 'min', 'max'].includes(agg.value));
      case 'date':
      case 'datetime':
      case 'created_time':
      case 'last_edited_time':
        return allAggregations.filter(agg => ['count', 'earliest', 'latest'].includes(agg.value));
      case 'checkbox':
        return allAggregations.filter(agg => ['count', 'sum'].includes(agg.value)); // sum of checked is useful
      case 'system':
        return allAggregations.filter(agg => ['count'].includes(agg.value));
      default:
        return allAggregations.filter(agg => ['count'].includes(agg.value));
    }
  };

  const selectedProperty = targetProperties.find(prop => prop.id === rollupProperty);
  const availableAggregations = selectedProperty ? getAvailableAggregations(selectedProperty.type) : [];

  // Auto-select appropriate aggregation when property changes
  useEffect(() => {
    if (selectedProperty && !availableAggregations.find(agg => agg.value === aggregation)) {
      const defaultAgg = availableAggregations[0];
      if (defaultAgg) {
        setAggregation(defaultAgg.value);
      }
    }
  }, [selectedProperty, availableAggregations, aggregation]);

  return (
    <div className="space-y-6">
      {/* Step 1: Choose Relation Field */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link className="h-4 w-4" />
            Step 1: Choose Relation Field
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relation-field">Relation Field</Label>
            <Select value={relationFieldId} onValueChange={handleRelationFieldChange}>
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No relation fields available. Create a relation field first to enable rollup calculations.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {selectedRelationField && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
              <p><strong>Selected relation:</strong> {selectedRelationField.name}</p>
              <p><strong>Links to:</strong> {targetDatabaseId ? 'Target database' : 'Unknown database'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Choose Property to Aggregate */}
      {relationFieldId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Step 2: Choose Property to Aggregate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rollup-property">Property from Related Records</Label>
              <Select value={rollupProperty} onValueChange={handleRollupPropertyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property to aggregate" />
                </SelectTrigger>
                <SelectContent>
                  {targetProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{property.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {property.type}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose which property from the related records to perform calculations on.
              </p>
            </div>

            {selectedProperty && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                <p><strong>Selected property:</strong> {selectedProperty.name}</p>
                <p><strong>Property type:</strong> {selectedProperty.type}</p>
                <p><strong>Available calculations:</strong> {availableAggregations.map(agg => agg.label).join(', ')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Choose Calculation */}
      {rollupProperty && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Step 3: Choose Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aggregation">Calculation Method</Label>
              <Select value={aggregation} onValueChange={handleAggregationChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableAggregations.map((agg) => (
                    <SelectItem key={agg.value} value={agg.value}>
                      <div className="space-y-1">
                        <div>{agg.label}</div>
                        <div className="text-xs text-muted-foreground">{agg.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculation Examples */}
            <div className="space-y-2">
              <Label>Calculation Examples</Label>
              <div className="space-y-1 text-xs text-muted-foreground">
                {selectedProperty?.type === 'number' && (
                  <>
                    <div><strong>Sum:</strong> Total of all number values</div>
                    <div><strong>Average:</strong> Average of all number values</div>
                    <div><strong>Min/Max:</strong> Smallest/largest number value</div>
                  </>
                )}
                {selectedProperty?.type === 'date' && (
                  <>
                    <div><strong>Earliest:</strong> First date chronologically</div>
                    <div><strong>Latest:</strong> Last date chronologically</div>
                  </>
                )}
                {selectedProperty?.type === 'checkbox' && (
                  <>
                    <div><strong>Count:</strong> Number of checked items</div>
                    <div><strong>Sum:</strong> Number of checked items (same as count)</div>
                  </>
                )}
                <div><strong>Count:</strong> Number of related records</div>
              </div>
            </div>

            {/* Final configuration summary */}
            <div className="text-sm bg-primary/10 p-3 rounded border">
              <p className="font-medium text-primary">Configuration Summary:</p>
              <p className="text-muted-foreground mt-1">
                This rollup will {aggregation} the "{selectedProperty?.name}" property 
                from records in the "{selectedRelationField?.name}" relation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
