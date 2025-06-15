
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_grantee_type') THEN
        CREATE TYPE public.permission_grantee_type AS ENUM ('user', 'group');
    END IF;
END$$;
