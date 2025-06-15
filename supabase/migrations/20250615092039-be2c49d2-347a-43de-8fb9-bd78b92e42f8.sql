
-- This migration adds essential database integrity constraints.
-- 1. It adds a foreign key from workspace_members to profiles to ensure every member has a profile.
-- 2. It creates a trigger to automatically create a profile for new users upon signup.

-- Step 1: Add a foreign key constraint to workspace_members.user_id
-- This links members to their profiles, enforcing data integrity.
-- ON DELETE CASCADE ensures that if a profile is deleted, their memberships are also removed.
ALTER TABLE public.workspace_members
ADD CONSTRAINT fk_workspace_members_user_id_to_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 2: Create a trigger on the auth.users table.
-- This trigger calls the handle_new_user function whenever a new user is created,
-- automatically populating the public.profiles table.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Drop if it exists to be safe
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
