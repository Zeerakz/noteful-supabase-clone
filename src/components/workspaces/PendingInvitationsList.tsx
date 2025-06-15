
import React from 'react';
import { PendingInvitation } from '@/hooks/useWorkspaceMembers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Copy, Trash2, Clock, AlertCircle } from 'lucide-react';
import { differenceInDays, isAfter } from 'date-fns';

interface PendingInvitationsListProps {
  invitations: PendingInvitation[];
  canManageMembers: boolean;
  onCopyInvite: (token: string) => void;
  onCancelInvite: (invite: PendingInvitation) => void;
}

const getExpirationStatus = (expiresAt: string) => {
  const expiration = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiration = differenceInDays(expiration, now);
  
  if (isAfter(now, expiration)) {
    return { status: 'expired', text: 'Expired', variant: 'destructive' as const };
  } else if (daysUntilExpiration <= 1) {
    return { status: 'expiring', text: `Expires ${daysUntilExpiration === 0 ? 'today' : 'tomorrow'}`, variant: 'secondary' as const };
  } else {
    return { status: 'active', text: `Expires in ${daysUntilExpiration} days`, variant: 'outline' as const };
  }
};

export function PendingInvitationsList({ invitations, canManageMembers, onCopyInvite, onCancelInvite }: PendingInvitationsListProps) {
  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 px-2">No pending invitations.</p>;
  }
  
  return (
    <div className="border rounded-lg">
      {invitations.map((invite, index) => {
        const expirationStatus = getExpirationStatus(invite.expires_at);
        return (
          <div key={invite.id} className={`flex items-center justify-between p-3 ${index < invitations.length - 1 ? 'border-b' : ''}`}>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback><Mail /></AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{invite.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground capitalize">{invite.role}</p>
                  <Badge variant={expirationStatus.variant} className="text-xs">
                    {expirationStatus.status === 'expired' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {expirationStatus.status === 'expiring' && <Clock className="w-3 h-3 mr-1" />}
                    {expirationStatus.text}
                  </Badge>
                </div>
              </div>
            </div>
            {canManageMembers && (
              <div className="flex items-center gap-1">
                {expirationStatus.status !== 'expired' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => onCopyInvite(invite.token)}
                    title="Copy invitation link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive" 
                  onClick={() => onCancelInvite(invite)}
                  title="Cancel invitation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
