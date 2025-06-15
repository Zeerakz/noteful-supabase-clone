
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupsManagementTab } from './GroupsManagementTab';

interface WorkspaceMembersModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceMembersModal({ workspaceId, isOpen, onClose }: WorkspaceMembersModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings & Members</DialogTitle>
          <DialogDescription>
            Manage workspace members, groups, and settings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <Tabs defaultValue="groups" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="flex-grow overflow-auto p-4">
              <div className="text-center text-muted-foreground p-8">
                Member management coming soon.
              </div>
            </TabsContent>
            <TabsContent value="groups" className="flex-grow overflow-auto p-4">
              <GroupsManagementTab workspaceId={workspaceId} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
