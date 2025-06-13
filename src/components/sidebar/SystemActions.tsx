
import React from 'react';
import { Trash2, Settings } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useNavigate, useParams } from 'react-router-dom';

export function SystemActions() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const systemItems = [
    {
      title: "Trash",
      icon: Trash2,
      onClick: () => {
        // Navigate to trash view - this would be implemented later
        console.log('Navigate to trash');
      },
      disabled: true, // Disable until trash functionality is implemented
    },
    {
      title: "Settings",
      icon: Settings,
      onClick: () => {
        // Navigate to workspace settings
        if (workspaceId) {
          navigate(`/workspace/${workspaceId}/settings`);
        }
      },
      disabled: false,
    },
  ];

  return (
    <SidebarMenu>
      {systemItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            onClick={item.onClick}
            disabled={item.disabled}
            className="text-muted-foreground hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
