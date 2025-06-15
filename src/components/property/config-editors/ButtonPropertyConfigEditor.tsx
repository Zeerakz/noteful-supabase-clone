
import React from 'react';
import { ButtonPropertyConfig, ButtonAction, CreatePageWithTemplateConfig, UpdatePagesConfig, OpenLinkConfig } from '@/types/property/configs/button';
import { DatabaseField, Database } from '@/types/database';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Settings, GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTemplates } from '@/hooks/useTemplates';
import { useDatabaseFields } from '@/hooks/useDatabaseFields';
import { useDatabases } from '@/hooks/useDatabases';
import { ComplexFilterModal } from '@/components/database/filters/ComplexFilterModal';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface ButtonPropertyConfigEditorProps {
  config: ButtonPropertyConfig;
  onConfigChange: (config: ButtonPropertyConfig) => void;
  workspaceId?: string;
}

export function ButtonPropertyConfigEditor({
  config,
  onConfigChange,
  workspaceId
}: ButtonPropertyConfigEditorProps) {
  const { templates } = useTemplates(workspaceId);
  const { databases } = useDatabases(workspaceId);
  const [expandedAction, setExpandedAction] = React.useState<string | null>(null);
  const [editingFilterForAction, setEditingFilterForAction] = React.useState<string | null>(null);

  const updateConfig = (updates: Partial<ButtonPropertyConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const addAction = () => {
    const newAction: ButtonAction = {
      id: `action_${Date.now()}`,
      type: 'open_link',
      label: 'New Action',
      config: { url: '', openInNewTab: true }
    };
    updateConfig({ actions: [...config.actions, newAction] });
    setExpandedAction(newAction.id);
  };

  const updateAction = (actionId: string, updates: Partial<ButtonAction> | { config: any }) => {
    const updatedActions = config.actions.map(action =>
      action.id === actionId ? { ...action, ...updates } : action
    );
    updateConfig({ actions: updatedActions });
  };

  const removeAction = (actionId: string) => {
    const updatedActions = config.actions.filter(action => action.id !== actionId);
    updateConfig({ actions: updatedActions });
    if (expandedAction === actionId) {
      setExpandedAction(null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(config.actions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    updateConfig({ actions: items });
  };

  const renderUpdatePagesConfig = (action: ButtonAction) => {
    const updateConfig = action.config as UpdatePagesConfig;
    const { fields: dbFields } = useDatabaseFields(updateConfig.targetDatabaseId);

    const addPropertyToUpdate = () => {
        const newProps = [...(updateConfig.propertiesToUpdate || []), { propertyId: '', value: '' }];
        updateAction(action.id, { config: { ...updateConfig, propertiesToUpdate: newProps } });
    };

    const updatePropertyToUpdate = (index: number, updates: { propertyId?: string; value?: string }) => {
        const updatedProps = [...(updateConfig.propertiesToUpdate || [])];
        updatedProps[index] = { ...updatedProps[index], ...updates };
        updateAction(action.id, { config: { ...updateConfig, propertiesToUpdate: updatedProps } });
    };

    const removePropertyToUpdate = (index: number) => {
        const updatedProps = (updateConfig.propertiesToUpdate || []).filter((_, i) => i !== index);
        updateAction(action.id, { config: { ...updateConfig, propertiesToUpdate: updatedProps } });
    };

    return (
        <div className="space-y-3">
            <div>
                <Label>Target</Label>
                <Select
                    value={updateConfig.target}
                    onValueChange={(value: 'current_page' | 'filtered_pages') => updateAction(action.id, { config: { ...updateConfig, target: value } })}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="current_page">Current Page</SelectItem>
                        <SelectItem value="filtered_pages">Filtered Pages</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {updateConfig.target === 'filtered_pages' && (
                <>
                    <div>
                        <Label>Database</Label>
                        <Select
                            value={updateConfig.targetDatabaseId || ''}
                            onValueChange={(value) => updateAction(action.id, { config: { ...updateConfig, targetDatabaseId: value, filter: undefined } })}
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
                        <Button variant="outline" onClick={() => setEditingFilterForAction(action.id)}>Edit Filter</Button>
                        <ComplexFilterModal
                          isOpen={editingFilterForAction === action.id}
                          onOpenChange={(isOpen) => !isOpen && setEditingFilterForAction(null)}
                          filter={updateConfig.filter}
                          onFilterChange={(newFilter) => updateAction(action.id, { config: { ...updateConfig, filter: newFilter }})}
                          databaseFields={dbFields}
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
                            {(updateConfig.target === 'current_page' ? [] : dbFields).filter(f => !f.type.endsWith('_by') && !f.type.endsWith('_time') && f.type !== 'rollup' && f.type !== 'formula' && f.type !== 'button').map((field) => (
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
  };

  const renderActionConfig = (action: ButtonAction) => {
    switch (action.type) {
      case 'create_page_with_template':
        const templateConfig = action.config as CreatePageWithTemplateConfig;
        const selectedTemplate = templates.find((t) => t.id === templateConfig.templateId);
        
        // The database ID should be stored within the template's content if it's a database page template.
        const databaseId = selectedTemplate?.content?.database_id;
        const { fields: databaseFields } = useDatabaseFields(databaseId);
        
        const addPrefilledProperty = () => {
            const newPrefilled = [...(templateConfig.prefilledProperties || []), { propertyId: '', value: '' }];
            updateAction(action.id, { config: { ...templateConfig, prefilledProperties: newPrefilled } });
        };
  
        const updatePrefilledProperty = (index: number, updates: { propertyId?: string; value?: string }) => {
            const updatedPrefilled = [...(templateConfig.prefilledProperties || [])];
            updatedPrefilled[index] = { ...updatedPrefilled[index], ...updates };
            updateAction(action.id, { config: { ...templateConfig, prefilledProperties: updatedPrefilled } });
        };
  
        const removePrefilledProperty = (index: number) => {
            const updatedPrefilled = (templateConfig.prefilledProperties || []).filter((_, i) => i !== index);
            updateAction(action.id, { config: { ...templateConfig, prefilledProperties: updatedPrefilled } });
        };

        return (
          <div className="space-y-3">
            <div>
              <Label>Template</Label>
              <Select
                value={templateConfig.templateId || ''}
                onValueChange={(value) => {
                  const newConfig = { ...templateConfig, templateId: value, prefilledProperties: [] };
                  updateAction(action.id, { config: newConfig });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Page Name (optional)</Label>
              <Input
                value={templateConfig.pageName || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...templateConfig, pageName: e.target.value }
                })}
                placeholder="Leave empty to use template name"
              />
            </div>
            <div className="space-y-2 pt-3 mt-3 border-t">
              <h5 className="text-sm font-medium">Prefill Properties</h5>
              {databaseId && databaseFields.length > 0 ? (
                 <div className="space-y-2">
                  {(templateConfig.prefilledProperties || []).map((prop, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Select
                        value={prop.propertyId}
                        onValueChange={(value) => updatePrefilledProperty(index, { propertyId: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {databaseFields.filter(f => !f.type.endsWith('_by') && !f.type.endsWith('_time') && f.type !== 'rollup' && f.type !== 'formula' && f.type !== 'button').map((field) => (
                            <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={prop.value}
                        onChange={(e) => updatePrefilledProperty(index, { value: e.target.value })}
                        placeholder="Value to set"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removePrefilledProperty(index)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPrefilledProperty} className="mt-2">
                    <Plus className="h-4 w-4 mr-1" /> Add property to prefill
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-1">
                  {selectedTemplate ? (databaseId ? 'No configurable properties found for this template\'s database.' : 'This template is not associated with a database.') : 'Select a template to configure properties.'}
                </p>
              )}
            </div>
          </div>
        );
      case 'update_pages':
        return renderUpdatePagesConfig(action);
      case 'open_link':
        const linkConfig = action.config as OpenLinkConfig;
        return (
          <div className="space-y-3">
            <div>
              <Label>URL</Label>
              <Input
                value={linkConfig.url || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...linkConfig, url: e.target.value }
                })}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={linkConfig.openInNewTab}
                onCheckedChange={(checked) => updateAction(action.id, {
                  config: { ...linkConfig, openInNewTab: checked }
                })}
              />
              <Label>Open in new tab</Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Button Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Button Label</Label>
            <Input
              value={config.label}
              onChange={(e) => updateConfig({ label: e.target.value })}
              placeholder="Button text"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Variant</Label>
              <Select
                value={config.variant}
                onValueChange={(value: any) => updateConfig({ variant: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                  <SelectItem value="destructive">Destructive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Size</Label>
              <Select
                value={config.size}
                onValueChange={(value: any) => updateConfig({ size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={config.disabled || false}
              onCheckedChange={(checked) => updateConfig({ disabled: checked })}
            />
            <Label>Disabled</Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Actions
            <Button onClick={addAction} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Action
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions configured</p>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="actions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {config.actions.map((action, index) => (
                      <Draggable key={action.id} draggableId={action.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <Card className="border-l-4 border-l-primary">
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 flex-grow">
                                    <div {...provided.dragHandleProps} className="cursor-grab p-1">
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <Input
                                      value={action.label}
                                      onChange={(e) => updateAction(action.id, { label: e.target.value })}
                                      className="font-medium"
                                      placeholder="Action label"
                                    />
                                    <Select
                                      value={action.type}
                                      onValueChange={(value: any) => updateAction(action.id, { 
                                        type: value,
                                        config: value === 'open_link' 
                                          ? { url: '', openInNewTab: true }
                                          : value === 'update_pages'
                                          ? { target: 'current_page', propertiesToUpdate: [] }
                                          : { templateId: '' }
                                      })}
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="create_page_with_template">Create Page</SelectItem>
                                        <SelectItem value="update_pages">Update Pages</SelectItem>
                                        <SelectItem value="open_link">Open Link</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      onClick={() => setExpandedAction(
                                        expandedAction === action.id ? null : action.id
                                      )}
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => removeAction(action.id)}
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              {expandedAction === action.id && (
                                <CardContent className="pt-0 pl-12">
                                  {renderActionConfig(action)}
                                </CardContent>
                              )}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
