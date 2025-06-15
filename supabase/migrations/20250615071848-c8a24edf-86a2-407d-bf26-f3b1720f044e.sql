
-- Create grantable_permission_level ENUM type if it doesn't exist.
-- This defines the possible permission levels that can be assigned.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grantable_permission_level') THEN
        CREATE TYPE public.grantable_permission_level AS ENUM ('view', 'comment', 'edit', 'full_access');
    END IF;
END$$;

-- Create a composite type to structure the return data for page sharers.
-- This defines the shape of the data our function will return.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_sharer_info') THEN
        CREATE TYPE public.page_sharer_info AS (
            permission_id uuid,
            grantee_id uuid,
            grantee_type public.permission_grantee_type,
            grantee_name text,
            grantee_avatar_url text,
            permission_level public.grantable_permission_level
        );
    END IF;
END$$;

-- Create or replace the function to get page sharers with guest-aware visibility.
-- This function is the core of the secure sharing feature.
CREATE OR REPLACE FUNCTION public.get_page_sharers(p_block_id uuid)
RETURNS SETOF public.page_sharer_info
LANGUAGE plpgsql
STABLE
SECURITY DEFINER -- Essential for checking roles of other users, which RLS would otherwise block.
SET search_path = public
AS $$
DECLARE
    v_workspace_id uuid;
    v_requesting_user_id uuid := auth.uid();
    v_requesting_user_role public.workspace_role;
BEGIN
    -- Find the workspace_id for the block from the blocks table.
    SELECT workspace_id INTO v_workspace_id FROM public.blocks WHERE id = p_block_id;

    IF v_workspace_id IS NULL THEN
        RETURN; -- Block not found or no workspace associated.
    END IF;

    -- Get the role of the user requesting the sharer list from workspace members.
    SELECT role INTO v_requesting_user_role
    FROM public.workspace_members
    WHERE user_id = v_requesting_user_id AND workspace_id = v_workspace_id;
    
    -- If user is not a member, they can't see sharers.
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- If the requester is a GUEST, return a filtered list that excludes other guests.
    IF v_requesting_user_role = 'guest' THEN
        RETURN QUERY
        WITH all_sharers AS (
            -- Get all user permissions for the block
            SELECT
                bp.id,
                bp.user_id AS grantee_id,
                'user'::public.permission_grantee_type AS grantee_type,
                prof.full_name AS grantee_name,
                prof.avatar_url AS grantee_avatar_url,
                bp.permission_level
            FROM public.block_permissions bp
            JOIN public.profiles prof ON bp.user_id = prof.id
            WHERE bp.block_id = p_block_id AND bp.grantee_type = 'user'
            UNION ALL
            -- Get all group permissions for the block
            SELECT
                bp.id,
                bp.group_id AS grantee_id,
                'group'::public.permission_grantee_type AS grantee_type,
                g.name AS grantee_name,
                NULL AS grantee_avatar_url,
                bp.permission_level
            FROM public.block_permissions bp
            JOIN public.groups g ON bp.group_id = g.id
            WHERE bp.block_id = p_block_id AND bp.grantee_type = 'group'
        )
        SELECT
            s.id,
            s.grantee_id,
            s.grantee_type,
            s.grantee_name,
            s.grantee_avatar_url,
            s.permission_level
        FROM all_sharers s
        LEFT JOIN public.workspace_members wm ON s.grantee_type = 'user' AND s.grantee_id = wm.user_id AND wm.workspace_id = v_workspace_id
        WHERE
            -- Always include groups and the user themselves
            s.grantee_type = 'group' OR s.grantee_id = v_requesting_user_id
            -- Include other users only if they are not guests
            OR (s.grantee_type = 'user' AND COALESCE(wm.role, 'member') <> 'guest');

    -- If the requester is a MEMBER, ADMIN, or OWNER, return the full list of sharers.
    ELSE
        RETURN QUERY
        -- Get all user permissions
        SELECT
            bp.id,
            bp.user_id,
            'user'::public.permission_grantee_type,
            prof.full_name,
            prof.avatar_url,
            bp.permission_level
        FROM public.block_permissions bp
        JOIN public.profiles prof ON bp.user_id = prof.id
        WHERE bp.block_id = p_block_id AND bp.grantee_type = 'user'
        UNION ALL
        -- Get all group permissions
        SELECT
            bp.id,
            bp.group_id,
            'group'::public.permission_grantee_type,
            g.name,
            NULL,
            bp.permission_level
        FROM public.block_permissions bp
        JOIN public.groups g ON bp.group_id = g.id
        WHERE bp.block_id = p_block_id AND bp.grantee_type = 'group';
    END IF;
END;
$$;
