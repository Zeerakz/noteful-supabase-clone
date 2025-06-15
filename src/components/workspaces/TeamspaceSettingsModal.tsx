
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTeamspaces, Teamspace } from '@/hooks/useTeamspaces';
import { useToast } from '@/hooks/use-toast';
import { TeamspaceMembersManager } from './TeamspaceMembersManager';
import { Loader2 } from 'lucide-react';

interface TeamspaceSettingsModalProps {
  teamspace: Teamspace;
  isOpen: boolean;
  onClose: () => void;
}

interface GeneralSettingsInputs {
  name: string;
  description: string;
  icon: string;
}

function GeneralSettingsTab({ teamspace, onClose }: { teamspace: Teamspace, onClose: () => void }) {
  const { updateTeamspace } = useTeamspaces(teamspace.workspace_id);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { isSubmitting, errors, isDirty } } = useForm<GeneralSettingsInputs>({
    defaultValues: {
      name: teamspace.name,
      description: teamspace.description || '',
      icon: teamspace.icon || '',
    },
  });

  const onSubmit: SubmitHandler<GeneralSettingsInputs> = async (data) => {
    const { error } = await updateTeamspace(teamspace.id, {
        name: data.name,
        description: data.description,
        icon: data.icon,
    });
    if (error) {
      toast({ title: "Error updating teamspace", description: error, variant: "destructive" });
    } else {
      toast({ title: "Teamspace updated successfully" });
      onClose();
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
       <div className="space-y-2">
        <Label htmlFor="icon">Icon (Emoji)</Label>
        <Input
          id="icon"
          {...register('icon')}
          placeholder="e.g. ✨"
          maxLength={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Teamspace Name</Label>
        <Input
          id="name"
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="What is this teamspace about?"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  )
}


export function TeamspaceSettingsModal({ teamspace, isOpen, onClose }: TeamspaceSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {teamspace.icon && <span className="mr-2 text-xl">{teamspace.icon}</span>}
            {teamspace.name} Settings
          </DialogTitle>
          <DialogDescription>
            Manage your teamspace settings and members.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralSettingsTab teamspace={teamspace} onClose={onClose} />
          </TabsContent>
          <TabsContent value="members">
            <div className="pt-4">
              <TeamspaceMembersManager teamspace={teamspace} />
            </div>
          </TabsContent>
          <TabsContent value="permissions">
            <div className="pt-4 text-center text-muted-foreground">
              <p>Permissions settings are coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
