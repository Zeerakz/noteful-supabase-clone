
-- Create presence table for tracking user presence and cursor positions
CREATE TABLE public.presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  cursor jsonb,
  last_heartbeat timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view presence in pages they have access to
CREATE POLICY "Users can view presence in accessible pages" 
  ON public.presence 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_id 
        AND (
          w.owner_user_id = auth.uid() OR
          w.is_public = true OR
          EXISTS (
            SELECT 1 FROM public.workspace_membership wm
            WHERE wm.workspace_id = w.id 
              AND wm.user_id = auth.uid() 
              AND wm.status = 'accepted'
          )
        )
    )
  );

-- Create policy that allows users to insert their own presence
CREATE POLICY "Users can create their own presence" 
  ON public.presence 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.pages p
      JOIN public.workspaces w ON p.workspace_id = w.id
      WHERE p.id = page_id 
        AND (
          w.owner_user_id = auth.uid() OR
          w.is_public = true OR
          EXISTS (
            SELECT 1 FROM public.workspace_membership wm
            WHERE wm.workspace_id = w.id 
              AND wm.user_id = auth.uid() 
              AND wm.status = 'accepted'
          )
        )
    )
  );

-- Create policy that allows users to update their own presence
CREATE POLICY "Users can update their own presence" 
  ON public.presence 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own presence
CREATE POLICY "Users can delete their own presence" 
  ON public.presence 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_presence_page_id ON public.presence(page_id);
CREATE INDEX idx_presence_user_id ON public.presence(user_id);
CREATE INDEX idx_presence_last_heartbeat ON public.presence(last_heartbeat);

-- Create unique constraint to ensure one presence record per user per page
CREATE UNIQUE INDEX idx_presence_unique_page_user ON public.presence(page_id, user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_presence_updated_at 
  BEFORE UPDATE ON public.presence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old presence records (older than 30 seconds)
CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.presence 
  WHERE last_heartbeat < now() - interval '30 seconds';
$$;
