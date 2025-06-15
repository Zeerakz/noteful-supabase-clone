
-- Create ENUM type for presence activity
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'presence_activity_enum') THEN
    CREATE TYPE public.presence_activity_enum AS ENUM ('editing', 'commenting', 'viewing');
  END IF;
END $$;

-- Add activity column to the presence table with a default value
ALTER TABLE public.presence
ADD COLUMN IF NOT EXISTS activity public.presence_activity_enum NOT NULL DEFAULT 'viewing';

