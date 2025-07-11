
import React from 'react';
import { OptimizedPropertyTableCell } from './OptimizedPropertyTableCell';
import { PermissionGate } from '../PermissionGate';
import { DatabaseField } from '@/types/database';
import { propertyRegistry } from '@/types/propertyRegistry';
import { getFieldPropertyType } from '@/utils/fieldTypeMapper';

interface PermissionAwareTableCellProps {
  field: DatabaseField;
  value: string;
  pageId: string;
  workspaceId: string;
  width: number;
  onValueChange: (value: string) => void;
  isResizing?: boolean;
  allFields?: DatabaseField[];
  rowIndex?: number;
}

export function PermissionAwareTableCell(props: PermissionAwareTableCellProps) {
  const { workspaceId, field, onValueChange, ...otherProps } = props;

  const mappedType = getFieldPropertyType(field);
  const definition = propertyRegistry.get(mappedType) || propertyRegistry.get(field.type as any);

  // For computed fields (rollups, formulas), don't allow editing regardless of permissions
  const isComputedField = definition?.isComputed ?? (field.type === 'rollup' || field.type === 'formula');
  
  console.log(`PermissionAwareTableCell - Field: ${field.name} (${field.type}), isComputed: ${isComputedField}, workspaceId: ${workspaceId}`);
  
  if (isComputedField) {
    console.log(`Field ${field.name} is computed, rendering without permission check`);
    return <OptimizedPropertyTableCell {...props} />;
  }

  console.log(`Field ${field.name} requires permission check for editing`);
  return (
    <PermissionGate
      workspaceId={workspaceId}
      requiredPermission="canEditContent"
      showTooltip={true}
    >
      <OptimizedPropertyTableCell
        {...props}
        onValueChange={onValueChange}
      />
    </PermissionGate>
  );
}
