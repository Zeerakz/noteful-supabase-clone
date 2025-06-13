
import React from 'react';
import { Trash2, Settings } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
    <ul role="group" aria-label="System actions">
      <SidebarMenu>
        {systemItems.map((item) => (
          <li key={item.title} role="treeitem">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  "sidebar-menu-item sidebar-focus-ring",
                  "sidebar-text-secondary hover:sidebar-text-primary",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label={item.disabled ? `${item.title} (coming soon)` : item.title}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.title}</span>
                {item.disabled && (
                  <span className="sr-only">(coming soon)</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </li>
        ))}
      </SidebarMenu>
    </ul>
  );
}
