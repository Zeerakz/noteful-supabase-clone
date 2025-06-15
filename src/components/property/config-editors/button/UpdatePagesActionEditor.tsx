
import React from 'react';
import { ButtonAction, UpdatePagesConfig } from '@/types/property/configs/button';
import { ComplexFilter } from '@/types/filters';
import { Database, DatabaseField } from '@/types/database';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { useDatabases } from '@/hooks/useDatabases';
import { ComplexFilterModal } from '@/components/database/filters/ComplexFilterModal';
import { createEmptyFilterGroup } from '@/utils/filterUtils';

interface UpdatePagesActionEditorProps {
  action: ButtonAction;
  onActionChange: (updates: Partial<ButtonAction> | { config: any }) => void;
  workspaceId?: string;
  currentDatabaseId?: string;
}

export function UpdatePagesActionEditor({ action, onActionChange, workspaceId, currentDatabaseId }: UpdatePagesActionEditorProps) {
  const updateConfig = action.config as UpdatePagesConfig;
  const { databases } = useDatabases(workspaceId);
  const { fields: dbFields } = useDatabaseFields(updateConfig.targetDatabaseId);
  const { fields: currentDbFields } = useDatabaseFields(currentDatabaseId);

  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  
  const updateActionConfig = (updates: Partial<UpdatePagesConfig>) => {
    onActionChange({ config: { ...updateConfig, ...updates } });
  };
  
  const addPropertyToUpdate = () => {
      const newProps = [...(updateConfig.propertiesToUpdate || []), { propertyId: '', value: '' }];
      updateActionConfig({ propertiesToUpdate: newProps });
  };

  const updatePropertyToUpdate = (index: number, updates: { propertyId?: string; value?: string }) => {
      const updatedProps = [...(updateConfig.propertiesToUpdate || [])];
      updatedProps[index] = { ...updatedProps[index], ...updates };
      updateActionConfig({ propertiesToUpdate: updatedProps });
  };

  const removePropertyToUpdate = (index: number) => {
      const updatedProps = (updateConfig.propertiesToUpdate || []).filter((_, i) => i !== index);
      updateActionConfig({ propertiesToUpdate: updatedProps });
  };
  
  const availableFields = updateConfig.target === 'filtered_pages' ? dbFields : currentDbFields;

  return (
      <div className="space-y-3">
          <div>
              <Label>Target</Label>
              <Select
                  value={updateConfig.target}
                  onValueChange={(value: 'current_page' | 'filtered_pages') => updateActionConfig({ target: value, targetDatabaseId: undefined, filter: undefined, propertiesToUpdate: [] })}
              >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="current_page">Current Page</SelectItem>
                      <SelectItem value="filtered_pages">Other Pages in a Database</SelectItem>
                  </SelectContent>
              </Select>
          </div>

          {updateConfig.target === 'filtered_pages' && (
              <>
                  <div>
                      <Label>Database</Label>
                      <Select
                          value={updateConfig.targetDatabaseId || ''}
                          onValueChange={(value) => updateActionConfig({ targetDatabaseId: value, filter: undefined, propertiesToUpdate: [] })}
                      >
                          <SelectTrigger><SelectValue placeholder="Select a database" /></SelectTrigger>
                          <SelectContent>
                              {databases.map((db: Database) => (
                                  <SelectItem key={db.id} value={db.id}>{db.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  {updateConfig.targetDatabaseId && (
                    <>
                      <Button variant="outline" onClick={() => setIsFilterModalOpen(true)}>Edit Filter</Button>
                      <ComplexFilterModal
                        open={isFilterModalOpen}
                        onOpenChange={setIsFilterModalOpen}
                        filterGroup={updateConfig.filter?.rootGroup || createEmptyFilterGroup()}
                        onFilterGroupChange={(newFilterGroup) => {
                          const newComplexFilter: ComplexFilter = {
                            id: updateConfig.filter?.id || crypto.randomUUID(),
                            rootGroup: newFilterGroup,
                          };
                          updateActionConfig({ filter: newComplexFilter });
                        }}
                        fields={dbFields}
                      />
                    </>
                  )}
              </>
          )}

          <div className="space-y-2 pt-3 mt-3 border-t">
            <h5 className="text-sm font-medium">Properties to Update</h5>
            {(updateConfig.propertiesToUpdate || []).map((prop, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                 <Select
                      value={prop.propertyId}
                      onValueChange={(value) => updatePropertyToUpdate(index, { propertyId: value })}
                  >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                      <SelectContent>
                          {availableFields.filter(f => !f.type.endsWith('_by') && !f.type.endsWith('_time') && f.type !== 'rollup' && f.type !== 'formula' && f.type !== 'button').map((field) => (
                              <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                <Input
                  value={prop.value}
                  onChange={(e) => updatePropertyToUpdate(index, { value: e.target.value })}
                  placeholder="Value to set"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removePropertyToUpdate(index)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addPropertyToUpdate} className="mt-2">
              <Plus className="h-4 w-4 mr-1" /> Add property to update
            </Button>
          </div>
      </div>
  );
}
