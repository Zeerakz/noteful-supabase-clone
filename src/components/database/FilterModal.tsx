import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { FilterGroup, FilterRule } from '@/types/filters';

export interface FilterRule {
  id: string;
  fieldId: string;
  operator: string;
  value: string;
}

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: DatabaseField[];
  filters: FilterGroup;
  onFiltersChange: (filters: FilterGroup) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

export function FilterModal({ 
  open, 
  onOpenChange, 
  fields, 
  filters, 
  onFiltersChange 
}: FilterModalProps) {
  const [editingFilter, setEditingFilter] = useState<FilterRule | null>(null);

  const form = useForm({
    defaultValues: {
      fieldId: '',
      operator: 'equals',
      value: '',
    },
  });

  const addFilter = (data: { fieldId: string; operator: string; value: string }) => {
    const newFilter: FilterRule = {
      id: crypto.randomUUID(),
      fieldId: data.fieldId,
      operator: data.operator as any,
      value: data.value,
    };

    const updatedFilters: FilterGroup = {
      ...filters,
      rules: [...filters.rules, newFilter]
    };

    onFiltersChange(updatedFilters);
    form.reset();
  };

  const removeFilter = (filterId: string) => {
    const updatedFilters: FilterGroup = {
      ...filters,
      rules: filters.rules.filter(f => f.id !== filterId)
    };
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    const updatedFilters: FilterGroup = {
      ...filters,
      rules: []
    };
    onFiltersChange(updatedFilters);
  };

  const getFieldName = (fieldId: string) => {
    return fields.find(f => f.id === fieldId)?.name || 'Unknown Field';
  };

  const getOperatorLabel = (operator: string) => {
    return OPERATORS.find(op => op.value === operator)?.label || operator;
  };

  const needsValue = (operator: string) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filter Database</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Filters */}
          {filters.rules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Active Filters</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              </div>
              <div className="space-y-2">
                {filters.rules.map((filter) => (
                  <div key={filter.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1 w-full">
                        <span className="font-medium">{getFieldName(filter.fieldId)}</span>
                        <span className="text-muted-foreground">{getOperatorLabel(filter.operator)}</span>
                        {needsValue(filter.operator) && (
                          <span className="font-medium">"{filter.value}"</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(filter.id)}
                          className="h-auto p-0 ml-auto"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Filter */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Add Filter</h4>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(addFilter)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="fieldId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fields.map((dbField) => (
                              <SelectItem key={dbField.id} value={dbField.id}>
                                {dbField.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operator</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OPERATORS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter value"
                            disabled={!needsValue(form.watch('operator'))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!form.watch('fieldId')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
