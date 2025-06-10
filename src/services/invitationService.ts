
import { supabase } from '@/integrations/supabase/client';

export interface InviteUserRequest {
  email: string;
  workspaceId: string;
  roleName: 'admin' | 'editor' | 'viewer';
  workspaceName: string;
  inviterName: string;
}

export class InvitationService {
  static async inviteUser(request: InviteUserRequest): Promise<{ error: string | null; success: boolean }> {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: request
      });

      if (error) throw error;

      return { error: null, success: true };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to send invitation',
        success: false 
      };
    }
  }

  static async getWorkspaceMemberships(workspaceId: string) {
    try {
      const { data, error } = await supabase
        .from('workspace_membership')
        .select(`
          id,
          user_id,
          status,
          invited_at,
          accepted_at,
          roles:role_id (
            role_name,
            description
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch memberships' 
      };
    }
  }

  static async updateMembershipStatus(
    membershipId: string, 
    status: 'accepted' | 'declined'
  ): Promise<{ error: string | null }> {
    try {
      const updateData = {
        status,
        ...(status === 'accepted' && { accepted_at: new Date().toISOString() })
      };

      const { error } = await supabase
        .from('workspace_membership')
        .update(updateData)
        .eq('id', membershipId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to update membership status' 
      };
    }
  }

  static async removeMembership(membershipId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('workspace_membership')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to remove membership' 
      };
    }
  }
}
