-- Ensure realtime is properly configured for blocks table

-- Set replica identity to FULL to capture all changes
ALTER TABLE public.blocks REPLICA IDENTITY FULL;

-- Add the blocks table to the realtime publication if not already added
DO $$
BEGIN
    -- Check if the table is already in the publication
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'blocks'
    ) THEN
        -- Add table to realtime publication
        ALTER PUBLICATION supabase_realtime ADD TABLE public.blocks;
    END IF;
END $$;