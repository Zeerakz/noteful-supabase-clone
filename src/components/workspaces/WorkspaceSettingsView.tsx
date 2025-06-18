
import React from 'react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceGeneralSettingsTab } from './WorkspaceGeneralSettingsTab';
import { MembersManagementTab } from './MembersManagementTab';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WorkspaceSettingsViewProps {
  workspaceId: string;
}

export function WorkspaceSettingsView({ workspaceId }: WorkspaceSettingsViewProps) {
  const { workspaces, loading } = useWorkspaces();
  
  if (loading) {
    return (
      <AppLayoutWithSidebar>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading workspace settings...</div>
            </div>
          </div>
        </ScrollArea>
      </AppLayoutWithSidebar>
    );
  }

  const workspace = workspaces.find(w => w.id === workspaceId);

  if (!workspace) {
    return (
      <AppLayoutWithSidebar>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Workspace not found</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </AppLayoutWithSidebar>
    );
  }

  const breadcrumbs = [
    { label: workspace.name, href: `/workspace/${workspaceId}` },
    { label: 'Settings' }
  ];

  return (
    <AppLayoutWithSidebar breadcrumbs={breadcrumbs}>
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Workspace Settings</h1>
            <p className="text-muted-foreground">Manage your workspace settings and members</p>
          </div>

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <WorkspaceGeneralSettingsTab workspaceId={workspaceId} />
            </TabsContent>
            
            <TabsContent value="members" className="space-y-4">
              <MembersManagementTab workspaceId={workspaceId} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </AppLayoutWithSidebar>
  );
}
