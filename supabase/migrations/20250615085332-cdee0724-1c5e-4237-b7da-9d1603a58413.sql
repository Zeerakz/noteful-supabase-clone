
-- This migration cleans up duplicate invitations and prevents future ones by adding a case-insensitive unique index.

-- Step 1: Clean up duplicate invitations, keeping only the most recent one for each email (case-insensitive) per workspace.
-- This ensures that if 'test@example.com' and 'Test@example.com' both exist for the same workspace, only the newest one is kept.
DELETE FROM public.invitations
WHERE id IN (
    SELECT id FROM (
        SELECT
            id,
            ROW_NUMBER() OVER(PARTITION BY workspace_id, LOWER(email) ORDER BY created_at DESC) as rn
        FROM public.invitations
    ) t
    WHERE t.rn > 1
);

-- Step 2: Drop any old index that might exist to avoid conflicts.
DROP INDEX IF EXISTS invitations_workspace_id_lower_email_idx;

-- Step 3: Add a unique index on workspace_id and the lowercased email.
-- This will enforce at the database level that an email address can only be invited once per workspace, regardless of casing.
CREATE UNIQUE INDEX invitations_workspace_id_lower_email_idx ON public.invitations (workspace_id, lower(email));
