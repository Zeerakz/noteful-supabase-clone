
import React, { useEffect, useState } from 'react';
import { DatabaseField, PageProperty } from '@/types/database';
import { FieldDependencyService } from '@/services/fieldDependencyService';
import { PagePropertyService } from '@/services/pagePropertyService';
import { Calculator, TrendingUp, Loader2 } from 'lucide-react';

interface ComputedFieldDisplayProps {
  field: DatabaseField;
  pageId: string;
  property?: PageProperty;
  onPropertyUpdate?: (property: PageProperty) => void;
}

export function ComputedFieldDisplay({ field, pageId, property, onPropertyUpdate }: ComputedFieldDisplayProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [computedValue, setComputedValue] = useState(property?.computed_value || '');

  useEffect(() => {
    if (field.type === 'formula' || field.type === 'rollup') {
      calculateValue();
    }
  }, [field.id, pageId]);

  const calculateValue = async () => {
    setIsCalculating(true);
    try {
      let result;
      
      if (field.type === 'formula') {
        const { data, error } = await FieldDependencyService.recalculateFormulaField(field.id, pageId);
        if (error) throw new Error(error);
        result = data || '';
      } else if (field.type === 'rollup') {
        const { data, error } = await FieldDependencyService.recalculateRollupField(field.id, pageId);
        if (error) throw new Error(error);
        result = data || '';
      }

      if (result) {
        setComputedValue(result);
        
        // Update the computed value in the database
        const { data: updatedProperty, error } = await PagePropertyService.updateComputedValue(
          pageId,
          field.id,
          result
        );
        
        if (!error && updatedProperty && onPropertyUpdate) {
          onPropertyUpdate(updatedProperty);
        }
      }
    } catch (error) {
      console.error('Failed to calculate field value:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getFieldIcon = () => {
    if (field.type === 'formula') {
      return <Calculator className="h-4 w-4" />;
    }
    if (field.type === 'rollup') {
      return <TrendingUp className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded border">
      {getFieldIcon()}
      <div className="flex-1">
        {isCalculating ? (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-sm">Calculating...</span>
          </div>
        ) : (
          <span className="text-sm">{computedValue || 'No value'}</span>
        )}
      </div>
      <button
        onClick={calculateValue}
        disabled={isCalculating}
        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        Recalculate
      </button>
    </div>
  );
}
