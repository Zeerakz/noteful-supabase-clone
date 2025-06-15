
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
    <div className="p-4 sm:p-6 md:p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings & Members</h1>
        <p className="text-muted-foreground mt-1">Manage your workspace members, groups, and settings.</p>
      </header>
      <Tabs defaultValue="members">
        <TabsList className="bg-muted/60 p-1 rounded-lg h-10">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <div className="mt-6">
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
