
-- Create the comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
-- Users can view comments on blocks they have access to
CREATE POLICY "Users can view comments on accessible blocks" 
  ON public.comments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages p ON b.page_id = p.id
      JOIN public.workspace_membership wm ON p.workspace_id = wm.workspace_id
      WHERE b.id = comments.block_id 
        AND wm.user_id = auth.uid() 
        AND wm.status = 'accepted'
    )
  );

-- Users can create comments on blocks they have access to
CREATE POLICY "Users can create comments on accessible blocks" 
  ON public.comments 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.pages p ON b.page_id = p.id
      JOIN public.workspace_membership wm ON p.workspace_id = wm.workspace_id
      WHERE b.id = comments.block_id 
        AND wm.user_id = auth.uid() 
        AND wm.status = 'accepted'
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" 
  ON public.comments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON public.comments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index for better performance on block_id queries
CREATE INDEX idx_comments_block_id ON public.comments(block_id);

-- Create an index for parent-child comment relationships
CREATE INDEX idx_comments_parent_id ON public.comments(parent_comment_id);

-- Add trigger to update updated_at timestamp if we add that column later
-- For now, we'll use created_at as the timestamp
