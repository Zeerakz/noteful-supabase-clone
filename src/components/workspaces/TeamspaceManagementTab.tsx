
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTeamspaces } from '@/hooks/useTeamspaces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TeamspaceMembersManager } from './TeamspaceMembersManager';

interface TeamspaceManagementTabProps {
  workspaceId: string;
}

interface CreateTeamspaceInputs {
  name: string;
}

export function TeamspaceManagementTab({ workspaceId }: TeamspaceManagementTabProps) {
  const { teamspaces, loading, createTeamspace } = useTeamspaces(workspaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTeamspaceInputs>();
  
  const onSubmit: SubmitHandler<CreateTeamspaceInputs> = async (data) => {
    setIsSubmitting(true);
    const { error } = await createTeamspace(data.name);
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
          <CardTitle>Create New Teamspace</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
            <div className="flex-grow">
              <Input
                {...register('name', { required: 'Teamspace name is required' })}
                placeholder="e.g. Engineering"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create
            </Button>
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
                    <span>{teamspace.name}</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CollapsibleTrigger>
              <CollapsibleContent className="p-4 border-t">
                <TeamspaceMembersManager teamspace={teamspace} />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
