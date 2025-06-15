
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersManagementTab } from './MembersManagementTab';
import { TeamspaceManagementTab } from './TeamspaceManagementTab';

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
            Manage workspace members, pending invitations, and teamspaces.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <Tabs defaultValue="members" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Members & Invitations</TabsTrigger>
              <TabsTrigger value="teamspaces">Teamspaces</TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="flex-grow overflow-auto p-4">
              <MembersManagementTab workspaceId={workspaceId} />
            </TabsContent>
            <TabsContent value="teamspaces" className="flex-grow overflow-auto p-4">
              <TeamspaceManagementTab workspaceId={workspaceId} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
