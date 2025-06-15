
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

  -- 2. Check if the email matches (if it's not a generic invite)
  IF v_invitation.email IS NOT NULL AND v_invitation.email <> p_user_email THEN
    RETURN json_build_object('success', false, 'message', 'This invitation is for a different email address.');
  END IF;

  -- 3. Check if user is already a member of the workspace
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

  -- 4. Add user to workspace_members
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (v_invitation.workspace_id, p_user_id, v_invitation.role)
  RETURNING workspace_id, role INTO v_workspace_id, v_role;

  -- 5. Delete the invitation
  DELETE FROM invitations WHERE id = v_invitation.id;

  -- 6. Return success with workspace_id for redirection
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
