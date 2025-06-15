
ALTER TABLE public.teamspaces ADD COLUMN icon TEXT;
COMMENT ON COLUMN public.teamspaces.icon IS 'Icon for the teamspace, e.g., an emoji or icon name.';
