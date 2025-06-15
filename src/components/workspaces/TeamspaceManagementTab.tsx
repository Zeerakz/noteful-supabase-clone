import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useTeamspaces, TeamspaceAccessLevel } from '@/hooks/useTeamspaces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Users, Lock, Unlock, Compass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TeamspaceMembersManager } from './TeamspaceMembersManager';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DiscoverTeamspacesModal } from './DiscoverTeamspacesModal';

interface TeamspaceManagementTabProps {
  workspaceId: string;
}

interface CreateTeamspaceInputs {
  name: string;
  access_level: TeamspaceAccessLevel;
}

export function TeamspaceManagementTab({ workspaceId }: TeamspaceManagementTabProps) {
  const { teamspaces, loading, createTeamspace, fetchTeamspaces } = useTeamspaces(workspaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors }, control } = useForm<CreateTeamspaceInputs>({
    defaultValues: {
      access_level: 'private',
    }
  });
  
  const onSubmit: SubmitHandler<CreateTeamspaceInputs> = async (data) => {
    setIsSubmitting(true);
    const { error } = await createTeamspace(data.name, undefined, data.access_level);
    if (error) {
      toast({ title: 'Error creating teamspace', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Teamspace created successfully' });
      reset();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Create New Teamspace</CardTitle>
            <Button variant="outline" onClick={() => setIsDiscoverModalOpen(true)}>
                <Compass className="mr-2 h-4 w-4" />
                Browse Teamspaces
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Teamspace Name</Label>
              <Input
                id="name"
                {...register('name', { required: 'Teamspace name is required' })}
                placeholder="e.g. Engineering"
                className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label>Access Level</Label>
              <Controller
                name="access_level"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-2 gap-4 mt-1"
                  >
                    <div>
                      <RadioGroupItem value="private" id="private" className="peer sr-only" />
                      <Label
                        htmlFor="private"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Lock className="mb-3 h-6 w-6" />
                        Private
                        <span className="text-xs text-center text-muted-foreground mt-1">Only invited members can see and join.</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="public" id="public" className="peer sr-only" />
                      <Label
                        htmlFor="public"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Unlock className="mb-3 h-6 w-6" />
                        Public
                        <span className="text-xs text-center text-muted-foreground mt-1">Visible to everyone in the workspace.</span>
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Teamspace
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading && <div className="text-center p-4">Loading teamspaces...</div>}

      {!loading && (
        <div className="space-y-2">
          <h4 className="font-medium">Teamspaces ({teamspaces.length})</h4>
          {teamspaces.map(teamspace => (
            <Collapsible key={teamspace.id} className="border rounded-lg">
                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 font-medium hover:bg-muted">
                    <div className="flex items-center gap-2">
                      {teamspace.access_level === 'private' ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                      <span>{teamspace.name}</span>
                    </div>
                    <span className="text-sm capitalize text-muted-foreground">{teamspace.access_level}</span>
                </CollapsibleTrigger>
              <CollapsibleContent className="p-4 border-t">
                <TeamspaceMembersManager teamspace={teamspace} />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
      
      <DiscoverTeamspacesModal
        isOpen={isDiscoverModalOpen}
        onClose={() => setIsDiscoverModalOpen(false)}
        onTeamspaceJoined={fetchTeamspaces}
        workspaceId={workspaceId}
      />
    </div>
  );
}
