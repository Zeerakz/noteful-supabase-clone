import React from 'react';
import { ButtonPropertyConfig, CreatePageWithTemplateConfig, SetPropertyValueConfig, OpenLinkConfig } from '@/types/property/configs/button';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ExternalLink, Plus, Edit } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyValueService } from '@/services/propertyValueService';
import { toast } from '@/hooks/use-toast';

interface ButtonFieldDisplayProps {
  value: any;
  config: ButtonPropertyConfig;
  field?: any;
  pageId?: string;
}

export function ButtonFieldDisplay({ 
  value, 
  config, 
  field, 
  pageId 
}: ButtonFieldDisplayProps) {
  const { createPageFromTemplate } = useTemplates();
  const { user } = useAuth();

  const executeAction = async (actionId: string) => {
    const action = config.actions.find(a => a.id === actionId);
    if (!action) return;

    try {
      switch (action.type) {
        case 'create_page_with_template':
          if (user) {
            const templateConfig = action.config as CreatePageWithTemplateConfig;
            const { data, error } = await createPageFromTemplate(
              templateConfig.templateId,
              templateConfig.pageName
            );
            if (error) {
              toast({
                title: "Error",
                description: error,
                variant: "destructive"
              });
            } else {
              toast({
                title: "Success",
                description: `Page "${data?.title}" created successfully`,
              });
            }
          }
          break;

        case 'set_property_value':
          if (pageId && user) {
            const propertyConfig = action.config as SetPropertyValueConfig;
            const targetPageId = propertyConfig.targetPageId || pageId;
            const { error } = await PropertyValueService.upsertPropertyValue(
              targetPageId,
              propertyConfig.targetFieldId,
              propertyConfig.value,
              user.id
            );
            if (error) {
              toast({
                title: "Error",
                description: error,
                variant: "destructive"
              });
            } else {
              toast({
                title: "Success",
                description: "Property updated successfully",
              });
            }
          }
          break;

        case 'open_link':
          const linkConfig = action.config as OpenLinkConfig;
          const url = linkConfig.url;
          if (url) {
            if (linkConfig.openInNewTab) {
              window.open(url, '_blank');
            } else {
              window.location.href = url;
            }
          }
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive"
      });
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create_page_with_template':
        return <Plus className="h-4 w-4 mr-2" />;
      case 'set_property_value':
        return <Edit className="h-4 w-4 mr-2" />;
      case 'open_link':
        return <ExternalLink className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  if (config.actions.length === 0) {
    return (
      <Button disabled variant="outline" size="sm">
        No actions configured
      </Button>
    );
  }

  if (config.actions.length === 1) {
    const action = config.actions[0];
    return (
      <Button
        onClick={() => executeAction(action.id)}
        variant={config.variant}
        size={config.size}
        disabled={config.disabled}
        className="flex items-center"
      >
        {getActionIcon(action.type)}
        {config.label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={config.variant}
          size={config.size}
          disabled={config.disabled}
          className="flex items-center"
        >
          {config.label}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {config.actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onClick={() => executeAction(action.id)}
            className="flex items-center"
          >
            {getActionIcon(action.type)}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
