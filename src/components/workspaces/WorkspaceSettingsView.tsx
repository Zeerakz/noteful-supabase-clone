
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersManagementTab } from './MembersManagementTab';
import { GroupsManagementTab } from './GroupsManagementTab';
import { WorkspaceGeneralSettingsTab } from './WorkspaceGeneralSettingsTab';

interface WorkspaceSettingsViewProps {
  workspaceId: string;
}

export function WorkspaceSettingsView({ workspaceId }: WorkspaceSettingsViewProps) {
  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings & Members</h1>
        <p className="text-muted-foreground">Manage your workspace members, groups, and settings.</p>
      </header>
      <Tabs defaultValue="members" className="flex flex-col h-full">
        <TabsList className="shrink-0">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <div className="flex-1 mt-4 overflow-y-auto">
            <TabsContent value="members">
              <MembersManagementTab workspaceId={workspaceId} />
            </TabsContent>
            <TabsContent value="groups">
              <GroupsManagementTab />
            </TabsContent>
            <TabsContent value="settings">
              <WorkspaceGeneralSettingsTab />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
