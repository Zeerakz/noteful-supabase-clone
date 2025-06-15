
import React, { useState } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroupsManagementTabProps {
  workspaceId: string;
}

export function GroupsManagementTab({ workspaceId }: GroupsManagementTabProps) {
  const { groups, loading, createGroup } = useGroups(workspaceId);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
        toast({ title: "Group name is required", variant: "destructive" });
        return;
    }
    setIsCreating(true);
    const { error } = await createGroup(newGroupName, newGroupDescription);
    setIsCreating(false);

    if (error) {
        toast({ title: "Error creating group", description: error, variant: "destructive" });
    } else {
        toast({ title: "Group created successfully" });
        setNewGroupName('');
        setNewGroupDescription('');
        setCreateDialogOpen(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Manage Groups</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new group to manage permissions for a set of users.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input id="description" value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} className="col-span-3" placeholder="(Optional)" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup} disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <div className="text-center p-4">Loading groups...</div>}

      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="text-base">{group.name}</CardTitle>
              {group.description && <CardDescription>{group.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span>{group.member_count} member(s)</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && groups.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No groups created yet.</p>
                <p className="text-sm text-muted-foreground">Create a group to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
}
