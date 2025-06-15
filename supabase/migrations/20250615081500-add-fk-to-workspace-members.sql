
-- This migration adds the missing foreign key constraint from the `workspace_members` table
-- to the `profiles` table. This relationship is required for Supabase to correctly join
-- these tables when fetching member data along with their profiles (e.g., name, avatar).
-- The absence of this foreign key causes an error when trying to display the list of workspace members.

ALTER TABLE public.workspace_members
ADD CONSTRAINT workspace_members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

