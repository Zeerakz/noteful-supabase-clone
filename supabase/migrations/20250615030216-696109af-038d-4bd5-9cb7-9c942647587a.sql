
--
-- Name: get_inherited_block_permission(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--
-- This function calculates the highest permission level a user has on a block
-- by checking the block and its entire ancestry (parents, grandparents, etc.).
-- It aggregates permissions from direct user grants, group memberships, and
-- block ownership, then returns the highest level found. This is a key part
-- of the hierarchical permission system.

CREATE OR REPLACE FUNCTION public.get_inherited_block_permission(p_block_id uuid, p_user_id uuid)
RETURNS public.block_permission_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
WITH RECURSIVE block_ancestry AS (
    -- Base case: start with the given block
    SELECT id, parent_id, created_by, 0 AS depth
    FROM public.blocks
    WHERE id = p_block_id

    UNION ALL

    -- Recursive step: join with parent, up to 10 levels deep for safety
    SELECT b.id, b.parent_id, b.created_by, ba.depth + 1
    FROM public.blocks b
    JOIN block_ancestry ba ON b.id = ba.parent_id
    WHERE ba.depth < 10
),
all_permissions AS (
    -- 1. Block creator gets full access to their created blocks
    SELECT 'full_access'::public.block_permission_level AS permission_level
    FROM block_ancestry
    WHERE created_by = p_user_id

    UNION ALL

    -- 2. Direct user permissions on any ancestor block
    SELECT bp.permission_level
    FROM public.block_permissions bp
    JOIN block_ancestry ba ON bp.block_id = ba.id
    WHERE bp.grantee_type = 'user' AND bp.user_id = p_user_id

    UNION ALL

    -- 3. Group permissions for the user on any ancestor block
    SELECT bp.permission_level
    FROM public.block_permissions bp
    JOIN public.group_memberships gm ON bp.group_id = gm.group_id
    JOIN block_ancestry ba ON bp.block_id = ba.id
    WHERE bp.grantee_type = 'group' AND gm.user_id = p_user_id
),
ordered_permissions AS (
    SELECT
        permission_level,
        -- Assign a numeric value to each permission level for ordering
        CASE permission_level
            WHEN 'full_access' THEN 4
            WHEN 'edit' THEN 3
            WHEN 'comment' THEN 2
            WHEN 'view' THEN 1
            ELSE 0
        END AS permission_value
    FROM all_permissions
)
-- Select the permission with the highest value, or NULL if no permissions found
SELECT permission_level
FROM ordered_permissions
ORDER BY permission_value DESC
LIMIT 1;
$$;
