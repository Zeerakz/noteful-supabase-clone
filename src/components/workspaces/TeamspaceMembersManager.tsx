import React, { useState, useEffect } from 'react';
import { useTeamspaces, Teamspace, TeamspaceMember } from '@/hooks/useTeamspaces';
import { usePeopleSearch } from '@/hooks/usePeopleSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface TeamspaceMembersManagerProps {
  teamspace: Teamspace;
}

const getInitials = (name?: string | null) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
};

export function TeamspaceMembersManager({ teamspace }: TeamspaceMembersManagerProps) {
  const { getTeamspaceMembers, addMemberToTeamspace, removeMemberFromTeamspace } = useTeamspaces(teamspace.workspace_id);
  const [members, setMembers] = useState<TeamspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const { searchUsers, results: searchResults, isLoading: isSearching } = usePeopleSearch(teamspace.workspace_id);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { toast } = useToast();

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const { data, error } = await getTeamspaceMembers(teamspace.id);
    if (error) {
      toast({ title: 'Error fetching members', description: error, variant: 'destructive' });
    } else {
      setMembers(data || []);
    }
    setLoadingMembers(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [teamspace.id]);

  useEffect(() => {
    if (debouncedSearchQuery) {
        searchUsers(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchUsers]);

  const handleAddMember = async (userId: string) => {
    const { error } = await addMemberToTeamspace(teamspace.id, userId);
    if (error) {
      toast({ title: 'Error adding member', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Member added' });
      fetchMembers();
      setSearchQuery('');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await removeMemberFromTeamspace(memberId);
    if (error) {
      toast({ title: 'Error removing member', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Member removed' });
      fetchMembers();
    }
  };
  
  const filteredSearchResults = searchResults.filter(
    (searchedUser) => !members.some((member) => member.user_id === searchedUser.id)
  );

  return (
    <div className="space-y-4">
      <div>
        <h5 className="font-medium mb-2">Add members</h5>
        <div className="relative">
            <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {searchQuery && (
          <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
            {filteredSearchResults.length > 0 ? (
                filteredSearchResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{user.name || user.email}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddMember(user.id)}>
                            <Plus className="h-4 w-4 mr-2" /> Add
                        </Button>
                    </div>
                ))
            ) : !isSearching && <p className="p-2 text-sm text-muted-foreground">No users found.</p>}
          </div>
        )}
      </div>

      <div>
        <h5 className="font-medium mb-2">Current Members ({members.length})</h5>
        {loadingMembers ? (
            <div className="text-center p-4">Loading...</div>
        ) : (
            <div className="space-y-2">
                {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(member.profiles?.full_name || member.profiles?.email)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{member.profiles?.full_name || member.profiles?.email}</p>
                                {member.role === 'admin' && (
                                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                                )}
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={member.role === 'admin'}
                            title={member.role === 'admin' ? 'Admins cannot be removed here.' : 'Remove member'}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
