
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Users, User, Link } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PermissionService } from '@/services/permissionService';
import { useWorkspaceMembers, WorkspaceMember } from '@/hooks/useWorkspaceMembers';
import { useUserGroups } from '@/hooks/useUserGroups';
import { BlockPermissionGrant, GrantablePermissionLevel } from '@/types/permissions';
import { UserGroup } from '@/types/userGroup';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  blockId: string;
  workspaceId: string;
}

const permissionLevels: GrantablePermissionLevel[] = ['view', 'comment', 'edit', 'full_access'];
const permissionDescriptions: Record<GrantablePermissionLevel, string> = {
  view: "Can view content.",
  comment: "Can view and comment.",
  edit: "Can edit content.",
  full_access: "Can edit and share.",
};

export function ShareDialog({ isOpen, onClose, blockId, workspaceId }: ShareDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [permissions, setPermissions] = useState<BlockPermissionGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { members: workspaceMembers } = useWorkspaceMembers(workspaceId);
  const { groups: userGroups } = useUserGroups(workspaceId);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data, error } = await PermissionService.getBlockPermissions(blockId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to load permissions.', variant: 'destructive' });
    } else {
      setPermissions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen, blockId]);

  const handleAddPermission = async (grantee: WorkspaceMember | UserGroup, type: 'user' | 'group') => {
    if (!user) return;
    const defaultPermission: GrantablePermissionLevel = 'edit';
    
    setSearchQuery('');
    
    let result;
    if (type === 'user') {
      result = await PermissionService.addUserPermission(blockId, (grantee as WorkspaceMember).user_id, defaultPermission, user.id);
    } else {
      result = await PermissionService.addGroupPermission(blockId, (grantee as UserGroup).id, defaultPermission, user.id);
    }

    if (result.error) {
      toast({ title: "Error", description: `Failed to add permission: ${result.error}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Permission added." });
      await fetchPermissions();
    }
  };

  const handleUpdatePermission = async (permissionId: string, level: GrantablePermissionLevel) => {
    const result = await PermissionService.updatePermission(permissionId, level);
    if (result.error) {
      toast({ title: "Error", description: "Failed to update permission.", variant: "destructive" });
    } else {
      setPermissions(prev => prev.map(p => p.id === permissionId ? { ...p, permission_level: level } : p));
      toast({ title: "Success", description: "Permission updated." });
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    const { error } = await PermissionService.removePermission(permissionId);
    if (error) {
      toast({ title: "Error", description: "Failed to remove permission.", variant: "destructive" });
    } else {
      setPermissions(prev => prev.filter(p => p.id !== permissionId));
      toast({ title: "Success", description: "Permission removed." });
    }
  };

  const filteredSearchables = useMemo(() => {
    if (!searchQuery) return [];
    
    const lowerCaseQuery = searchQuery.toLowerCase();

    const existingUserIds = new Set(permissions.filter(p => p.grantee_type === 'user').map(p => p.user_id));
    const existingGroupIds = new Set(permissions.filter(p => p.grantee_type === 'group').map(p => p.group_id));

    const searchableMembers = workspaceMembers
      .filter(m => !existingUserIds.has(m.user_id))
      .filter(m => m.profiles?.full_name?.toLowerCase().includes(lowerCaseQuery) || m.profiles?.email?.toLowerCase().includes(lowerCaseQuery))
      .map(m => ({ ...m, type: 'user' as const }));

    const searchableGroups = userGroups
      .filter(g => !existingGroupIds.has(g.id))
      .filter(g => g.name.toLowerCase().includes(lowerCaseQuery))
      .map(g => ({ ...g, type: 'group' as const }));
    
    return [...searchableMembers, ...searchableGroups];
  }, [searchQuery, workspaceMembers, userGroups, permissions]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Page</DialogTitle>
          <DialogDescription>
            Invite people and groups to this page.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Input 
            placeholder="Search people or groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {filteredSearchables.length > 0 ? (
                filteredSearchables.map(item => (
                  <div 
                    key={`${item.type}-${item.id}`} 
                    className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer"
                    onClick={() => handleAddPermission(item, item.type)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.type === 'user' ? item.profiles?.avatar_url || undefined : undefined} />
                      <AvatarFallback>
                        {item.type === 'user' ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.type === 'user' ? item.profiles?.full_name : item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.type === 'user' ? item.profiles?.email : `${item.type}`}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-muted-foreground">No results found.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
          {loading ? (
            <p className="text-muted-foreground text-center">Loading permissions...</p>
          ) : (
            permissions.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.grantee_avatar_url || undefined} />
                    <AvatarFallback>
                      {p.grantee_type === 'user' ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{p.grantee_name}</p>
                    <p className="text-xs text-muted-foreground">{permissionDescriptions[p.permission_level]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={p.permission_level}
                    onValueChange={(value) => handleUpdatePermission(p.id, value as GrantablePermissionLevel)}
                  >
                    <SelectTrigger className="w-[120px] capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {permissionLevels.map(level => (
                        <SelectItem key={level} value={level} className="capitalize">{level.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemovePermission(p.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-md">
          <div className="flex items-center gap-3">
            <Link className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">Copy Link</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link copied!' });
          }}>Copy</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
