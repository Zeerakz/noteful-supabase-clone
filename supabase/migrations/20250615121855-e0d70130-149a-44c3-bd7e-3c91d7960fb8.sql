
-- Add expiration functionality to invitations table
ALTER TABLE public.invitations 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- Create index for efficient cleanup of expired invitations
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

-- Add function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.invitations 
  WHERE expires_at < now();
$$;

-- Update the accept_invitation function to check expiration
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text, p_user_id uuid, p_user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation invitations;
  v_existing_member workspace_members;
  v_workspace_id uuid;
  v_role workspace_role;
BEGIN
  -- 1. Find invitation by token
  SELECT * INTO v_invitation FROM invitations WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired invitation token.');
  END IF;

  -- 2. Check if invitation has expired
  IF v_invitation.expires_at < now() THEN
    -- Delete expired invitation
    DELETE FROM invitations WHERE id = v_invitation.id;
    RETURN json_build_object('success', false, 'message', 'This invitation has expired. Please request a new invitation.');
  END IF;

  -- 3. Check if the email matches (case-insensitive if it's not a generic invite)
  IF v_invitation.email IS NOT NULL AND LOWER(v_invitation.email) <> LOWER(p_user_email) THEN
    RETURN json_build_object('success', false, 'message', 'This invitation is for a different email address.');
  END IF;

  -- 4. Check if user is already a member of the workspace
  SELECT * INTO v_existing_member
  FROM workspace_members
  WHERE user_id = p_user_id AND workspace_id = v_invitation.workspace_id;

  IF FOUND THEN
    -- User is already a member, so just delete the invitation and inform them.
    DELETE FROM invitations WHERE id = v_invitation.id;
    RETURN json_build_object(
      'success', true,
      'message', 'You are already a member of this workspace.',
      'workspace_id', v_invitation.workspace_id
    );
  END IF;

  -- 5. Add user to workspace_members
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (v_invitation.workspace_id, p_user_id, v_invitation.role)
  RETURNING workspace_id, role INTO v_workspace_id, v_role;

  -- 6. Delete the invitation
  DELETE FROM invitations WHERE id = v_invitation.id;

  -- 7. Return success with workspace_id for redirection
  RETURN json_build_object(
    'success', true,
    'message', 'Invitation accepted! Welcome to the workspace.',
    'workspace_id', v_workspace_id,
    'role', v_role
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in accept_invitation: %', SQLERRM;
    RETURN json_build_object('success', false, 'message', 'An internal error occurred.');
END;
$$;

-- Create invitation analytics table
CREATE TABLE public.invitation_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'accepted', 'expired', 'resent')),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for analytics queries
CREATE INDEX idx_invitation_analytics_workspace_event ON public.invitation_analytics(workspace_id, event_type, created_at);
CREATE INDEX idx_invitation_analytics_invitation ON public.invitation_analytics(invitation_id, event_type);

-- Enable RLS on invitation analytics
ALTER TABLE public.invitation_analytics ENABLE ROW LEVEL SECURITY;

-- Policy for viewing invitation analytics (workspace admins/owners only)
CREATE POLICY "Workspace admins can view invitation analytics"
ON public.invitation_analytics FOR SELECT
USING (check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[]));

-- Policy for inserting analytics (system operations)
CREATE POLICY "System can insert invitation analytics"
ON public.invitation_analytics FOR INSERT
WITH CHECK (true);
