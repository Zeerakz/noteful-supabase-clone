
-- This migration ensures that every user in auth.users has a corresponding profile in public.profiles.
-- This is a one-time backfill script to fix inconsistencies and ensure data integrity.
-- It populates the profile with the user's ID, email, and full name from their authentication record.

INSERT INTO public.profiles (id, email, full_name)
SELECT 
  u.id, 
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
