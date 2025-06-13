
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DatabaseField } from '@/types/database';
import { PropertyType } from '@/types/property';
import { PropertyList } from './PropertyList';
import { PropertyEditPanel } from './PropertyEditPanel';
import { NewPropertyWizard } from './NewPropertyWizard';
import { PermissionGate } from '../PermissionGate';
import { useDatabasePermissions } from '@/hooks/useDatabasePermissions';

interface ManagePropertiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: DatabaseField[];
  workspaceId: string;
  onFieldsReorder: (fields: DatabaseField[]) => Promise<void>;
  onFieldUpdate: (fieldId: string, updates: Partial<DatabaseField>) => Promise<void>;
  onFieldDuplicate: (field: DatabaseField) => Promise<void>;
  onFieldDelete: (fieldId: string) => Promise<void>;
  onFieldCreate: (field: { name: string; type: PropertyType; settings?: any }) => Promise<void>;
}

export function ManagePropertiesModal({ 
  open, 
  onOpenChange, 
  fields,
  workspaceId,
  onFieldsReorder,
  onFieldUpdate,
  onFieldDuplicate,
  onFieldDelete,
  onFieldCreate
}: ManagePropertiesModalProps) {
  const [editingField, setEditingField] = useState<DatabaseField | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [showPropertyWizard, setShowPropertyWizard] = useState(false);
  const { permissions } = useDatabasePermissions(workspaceId);

  const handleDeleteField = async (fieldId: string) => {
    try {
      await onFieldDelete(fieldId);
      setDeleteFieldId(null);
    } catch (error) {
      console.error('Failed to delete field:', error);
    }
  };

  const handleDuplicateField = async (field: DatabaseField) => {
    try {
      await onFieldDuplicate(field);
    } catch (error) {
      console.error('Failed to duplicate field:', error);
    }
  };

  const handleDeleteConfirmation = async (fieldId: string) => {
    setDeleteFieldId(fieldId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Manage Properties
              {!permissions.canModifySchema && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (View Only - Full access required to modify schema)
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-6 h-[60vh]">
            <PermissionGate
              workspaceId={workspaceId}
              requiredPermission="canModifySchema"
              fallback={
                <div className="flex-1 p-4 border border-dashed border-border rounded-lg bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <p className="font-medium">Schema Management Restricted</p>
                    <p className="text-sm mt-1">
                      You need 'Full access' permission to add, edit, or delete properties.
                    </p>
                  </div>
                </div>
              }
            >
              <PropertyList
                fields={fields}
                editingField={editingField}
                onEditingFieldChange={setEditingField}
                onFieldsReorder={onFieldsReorder}
                onFieldUpdate={onFieldUpdate}
                onFieldDuplicate={handleDuplicateField}
                onFieldDelete={handleDeleteConfirmation}
                onAddProperty={() => setShowPropertyWizard(true)}
              />
            </PermissionGate>
            
            {editingField && permissions.canModifySchema && (
              <>
                <Separator orientation="vertical" />
                <PropertyEditPanel
                  editingField={editingField}
                  fields={fields}
                  onFieldChange={setEditingField}
                  onSave={async () => {
                    await onFieldUpdate(editingField.id, {
                      name: editingField.name,
                      type: editingField.type,
                      settings: editingField.settings
                    });
                    setEditingField(null);
                  }}
                  onCancel={() => setEditingField(null)}
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Property Wizard - only show if user has schema permissions */}
      {permissions.canModifySchema && (
        <NewPropertyWizard
          open={showPropertyWizard}
          onOpenChange={setShowPropertyWizard}
          onPropertyCreate={onFieldCreate}
          workspaceId={workspaceId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFieldId} onOpenChange={() => setDeleteFieldId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone
              and will remove all data in this property for all entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFieldId && handleDeleteField(deleteFieldId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
