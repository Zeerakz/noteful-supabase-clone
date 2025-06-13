
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckboxPropertyConfig } from '@/types/property/configs/checkbox';

interface CheckboxPropertyConfigEditorProps {
  control: Control<any>;
  config: CheckboxPropertyConfig;
}

export function CheckboxPropertyConfigEditor({ 
  control, 
  config 
}: CheckboxPropertyConfigEditorProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="config.defaultValue"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Default value</FormLabel>
              <FormDescription>
                The default state for new entries
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="config.trueLabel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>True label</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Yes"
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              Text displayed when checkbox is checked
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="config.falseLabel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>False label</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="No"
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              Text displayed when checkbox is unchecked
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}
