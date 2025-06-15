
import React from 'react';

interface FormulaFieldDisplayProps {
    computedValue?: string;
}

export function FormulaFieldDisplay({ computedValue }: FormulaFieldDisplayProps) {
    return (
        <div className="text-sm text-muted-foreground italic">
            {computedValue || 'Formula not calculated'}
        </div>
    );
}
