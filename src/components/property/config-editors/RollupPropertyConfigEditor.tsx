
import React, { useState, useEffect } from 'react';
import { RollupPropertyConfig, Property, PropertyType, RelationProperty } from '@/types/property';
import { DatabaseField, FieldType } from '@/types/database';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, Link, Target, AlertCircle } from 'lucide-react';

interface RollupPropertyConfigEditorProps {
  config: any;
  onConfigChange: (config: RollupPropertyConfig) => void;
  availableProperties?: Property[];
}

type AggregationType = 'sum' | 'count' | 'average' | 'min' | 'max' | 'earliest' | 'latest' | 'unique';

interface PropertyOption {
  id: string;
  name: string;
  type: PropertyType | FieldType | 'system';
}

export function RollupPropertyConfigEditor({ config, onConfigChange, availableProperties = [] }: RollupPropertyConfigEditorProps) {
  const rollupConfig = config as RollupPropertyConfig;

  const [targetProperties, setTargetProperties] = useState<PropertyOption[]>([]);
  const [selectedRelation, setSelectedRelation] = useState<RelationProperty | null>(null);

  const relationProperties = availableProperties.filter(prop => prop.type === 'relation') as RelationProperty[];

  useEffect(() => {
    const fetchTargetProperties = async () => {
      if (!rollupConfig.relationFieldId) {
        setTargetProperties([]);
        setSelectedRelation(null);
        return;
      }

      const relation = relationProperties.find(p => p.id === rollupConfig.relationFieldId);
      if (!relation) return;

      setSelectedRelation(relation);
      const targetDbId = relation.config.targetDatabaseId;

      if (!targetDbId) {
        setTargetProperties([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('database_properties')
          .select('id, name, type')
          .eq('database_id', targetDbId);

        if (error) throw new Error(error.message);
        
        const fields = data as DatabaseField[];

        const properties: PropertyOption[] = [
          { id: 'count', name: 'Count of all related pages', type: 'system' },
          ...(fields || []).map(field => ({
            id: field.id,
            name: field.name,
            type: field.type,
          })),
        ];
        setTargetProperties(properties);
      } catch (err) {
        console.error('Error fetching target database properties:', err);
        setTargetProperties([]);
      }
    };

    fetchTargetProperties();
  }, [rollupConfig.relationFieldId, relationProperties]);

  const updateConfig = (updates: Partial<RollupPropertyConfig>) => {
    onConfigChange({ ...rollupConfig, ...updates });
  };
  
  const handleRelationChange = (value: string) => {
    updateConfig({ relationFieldId: value, targetPropertyId: '' });
  };

  const getAvailableAggregations = (propertyType: PropertyOption['type']): { value: AggregationType; label: string }[] => {
    switch (propertyType) {
      case 'number':
      case 'currency':
      case 'progress':
      case 'rating':
        return [
          { value: 'sum', label: 'Sum' },
          { value: 'average', label: 'Average' },
          { value: 'min', label: 'Minimum' },
          { value: 'max', label: 'Maximum' },
          { value: 'count', label: 'Count values' },
          { value: 'unique', label: 'Count unique values' },
        ];
      case 'date':
      case 'datetime':
      case 'created_time':
      case 'last_edited_time':
        return [
          { value: 'earliest', label: 'Earliest' },
          { value: 'latest', label: 'Latest' },
          { value: 'count', label: 'Count values' },
        ];
      case 'system': // 'Count of all related pages'
        return [{ value: 'count', label: 'Count all' }];
      default:
        return [
          { value: 'count', label: 'Count values' },
          { value: 'unique', label: 'Count unique values' },
        ];
    }
  };

  const selectedProperty = targetProperties.find(p => p.id === rollupConfig.targetPropertyId);
  const availableAggregations = selectedProperty ? getAvailableAggregations(selectedProperty.type) : [];

  useEffect(() => {
    if (selectedProperty && !availableAggregations.find(agg => agg.value === rollupConfig.aggregation)) {
      updateConfig({ aggregation: availableAggregations[0]?.value || 'count' });
    }
  }, [selectedProperty, rollupConfig.aggregation]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Link className="h-4 w-4" />Step 1: Choose Relation</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={rollupConfig.relationFieldId || ''} onValueChange={handleRelationChange}>
            <SelectTrigger><SelectValue placeholder="Select a relation..." /></SelectTrigger>
            <SelectContent>
              {relationProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {relationProperties.length === 0 && (
            <Alert className="mt-2"><AlertCircle className="h-4 w-4" /><AlertDescription>No relation properties found. Add a relation first.</AlertDescription></Alert>
          )}
        </CardContent>
      </Card>

      {selectedRelation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" />Step 2: Choose Property</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={rollupConfig.targetPropertyId || ''} onValueChange={(value) => updateConfig({ targetPropertyId: value })}>
              <SelectTrigger><SelectValue placeholder="Select a property to roll up..." /></SelectTrigger>
              <SelectContent>
                {targetProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedProperty && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" />Step 3: Choose Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={rollupConfig.aggregation || 'count'} onValueChange={(value) => updateConfig({ aggregation: value as AggregationType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableAggregations.map(agg => <SelectItem key={agg.value} value={agg.value}>{agg.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
