
-- Enable realtime for the pages table
ALTER TABLE public.pages REPLICA IDENTITY FULL;

-- Enable realtime for the page_properties table  
ALTER TABLE public.page_properties REPLICA IDENTITY FULL;

-- Add the pages table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.pages;

-- Add the page_properties table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_properties;
