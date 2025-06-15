
```typescript
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useDiscoverTeamspaces } from '@/hooks/useDiscoverTeamspaces';
import { useTeamspaces } from '@/hooks/useTeamspaces';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Unlock, Lock, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscoverTeamspacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamspaceJoined: () => void;
  workspaceId: string;
}

export function DiscoverTeamspacesModal({ isOpen, onClose, onTeamspaceJoined, workspaceId }: DiscoverTeamspacesModalProps) {
  const { teamspaces, loading, refresh } = useDiscoverTeamspaces(workspaceId);
  const { addMemberToTeamspace } = useTeamspaces(workspaceId);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleJoin = async (teamspaceId: string) => {
    if (!user) {
        toast({ title: 'You must be logged in to join a teamspace.', variant: 'destructive' });
        return;
    }
    const { error } = await addMemberToTeamspace(teamspaceId, user.id);
    if (error) {
      toast({ title: 'Error joining teamspace', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Successfully joined teamspace!' });
      refresh();
      onTeamspaceJoined();
    }
  };

  const handleView = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Discover Teamspaces</DialogTitle>
          <DialogDescription>
            Browse and join available teamspaces in this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {teamspaces.filter(ts => !ts.is_member).length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-10">No new teamspaces to join.</p>
              )}
              {teamspaces.filter(ts => !ts.is_member).map((ts) => (
                <div key={ts.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="flex-1 space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      {ts.access_level === 'public' ? (
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <p className="font-semibold">{ts.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{ts.description || 'No description.'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{ts.member_count} {ts.member_count === 1 ? 'member' : 'members'}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {ts.is_member ? (
                      <Button variant="outline" onClick={handleView} disabled>Joined</Button>
                    ) : ts.access_level === 'public' ? (
                      <Button onClick={() => handleJoin(ts.id)}><UserPlus className="mr-2 h-4 w-4" />Join</Button>
                    ) : (
                      <Button disabled variant="outline">Private</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```
