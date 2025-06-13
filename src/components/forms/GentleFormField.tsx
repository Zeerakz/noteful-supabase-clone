
import React from 'react';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { GentleFieldError } from '@/components/ui/gentle-error';
import { cn } from '@/lib/utils';

interface GentleFormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  suggestion?: string;
  fieldName?: string;
  required?: boolean;
  className?: string;
}

export function GentleFormField({
  children,
  label,
  error,
  suggestion,
  fieldName,
  required = false,
  className
}: GentleFormFieldProps) {
  return (
    <FormItem className={cn("space-y-2", className)}>
      {label && (
        <FormLabel className="text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="text-amber-600 dark:text-amber-400 ml-1" aria-label="required">
              *
            </span>
          )}
        </FormLabel>
      )}
      
      <GentleFieldError 
        error={error} 
        suggestion={suggestion}
        fieldName={fieldName}
      >
        <FormControl>
          <div className="gentle-focus">
            {children}
          </div>
        </FormControl>
      </GentleFieldError>
      
      {/* Hide default form message since we use GentleError */}
      <FormMessage className="sr-only" />
    </FormItem>
  );
}
