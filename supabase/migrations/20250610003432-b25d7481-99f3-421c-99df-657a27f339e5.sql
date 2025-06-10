
-- Enable realtime for the blocks table
ALTER TABLE public.blocks REPLICA IDENTITY FULL;

-- Add the blocks table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocks;
