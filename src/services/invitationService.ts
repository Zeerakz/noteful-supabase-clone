import { supabase } from '@/integrations/supabase/client';
import { WorkspaceRole } from '@/types/db';

export interface InviteUserRequest {
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
  workspaceName: string;
  inviterName: string;
}

export class InvitationService {
  static async inviteUser(request: InviteUserRequest): Promise<{ error: string | null; success: boolean; data?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: request
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return { error: null, success: true, data };
    } catch (err: any) {
      // Improved error handling for Edge Functions
      if (err.context && err.context.error) {
        return { error: err.context.error, success: false };
      }
      return { 
        error: err instanceof Error ? err.message : 'Failed to send invitation',
        success: false 
      };
    }
  }

  static async acceptInvitation(token: string): Promise<{ error: string | null; data?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return { error: null, data };
    } catch (err: any) {
      console.error("Error in acceptInvitation service:", err);
      // Supabase FunctionsHttpError contains the response body in `context`
      if (err.context && err.context.error) {
        return { error: err.context.error, data: null };
      }
      return { 
        error: err instanceof Error ? err.message : 'Failed to accept invitation',
        data: null 
      };
    }
  }

  static async getWorkspaceMembers(workspaceId: string) {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch members' 
      };
    }
  }

  static async getPendingInvitations(workspaceId: string) {
    try {
      // Clean up expired invitations first
      await supabase.rpc('cleanup_expired_invitations');

      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, role, created_at, expires_at, token')
        .eq('workspace_id', workspaceId)
        .gt('expires_at', new Date().toISOString()) // Only get non-expired invitations
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch invitations'
      };
    }
  }

  static async cancelInvitation(invitationId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to cancel invitation' };
    }
  }

  static async removeMember(memberId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to remove member' };
    }
  }

  static async updateMemberRole(memberId: string, role: WorkspaceRole): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update role' };
    }
  }

  static async getInvitationAnalytics(workspaceId: string) {
    try {
      const { data, error } = await supabase
        .from('invitation_analytics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch analytics'
      };
    }
  }
}
