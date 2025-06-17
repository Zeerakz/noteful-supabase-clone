
-- Update the block_type_enum to include the missing UI block types
ALTER TYPE public.block_type_enum ADD VALUE IF NOT EXISTS 'two_column';
ALTER TYPE public.block_type_enum ADD VALUE IF NOT EXISTS 'table';
ALTER TYPE public.block_type_enum ADD VALUE IF NOT EXISTS 'embed';
ALTER TYPE public.block_type_enum ADD VALUE IF NOT EXISTS 'file_attachment';

-- Enable realtime for the blocks table to ensure proper synchronization
ALTER TABLE public.blocks REPLICA IDENTITY FULL;

-- Add the blocks table to the realtime publication if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'blocks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.blocks;
    END IF;
END $$;
