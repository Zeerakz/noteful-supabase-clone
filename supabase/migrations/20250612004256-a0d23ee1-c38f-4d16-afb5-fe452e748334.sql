
-- Create files table to store file attachment metadata
CREATE TABLE public.files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  block_id uuid REFERENCES public.blocks(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check workspace access
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(target_workspace_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_membership wm
    WHERE wm.workspace_id = target_workspace_id 
    AND wm.user_id = user_id 
    AND wm.status = 'accepted'
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = target_workspace_id 
    AND w.owner_user_id = user_id
  );
$$;

-- Policy for viewing files - users can view files in workspaces they have access to
CREATE POLICY "Users can view files in accessible workspaces" 
  ON public.files 
  FOR SELECT 
  USING (
    public.user_has_workspace_access(workspace_id, auth.uid())
  );

-- Policy for inserting files - users can upload files to workspaces they have access to
CREATE POLICY "Users can upload files to accessible workspaces" 
  ON public.files 
  FOR INSERT 
  WITH CHECK (
    uploaded_by = auth.uid() AND
    public.user_has_workspace_access(workspace_id, auth.uid())
  );

-- Policy for updating files - users can update files they uploaded in accessible workspaces
CREATE POLICY "Users can update their files in accessible workspaces" 
  ON public.files 
  FOR UPDATE 
  USING (
    uploaded_by = auth.uid() AND
    public.user_has_workspace_access(workspace_id, auth.uid())
  );

-- Policy for deleting files - users can delete files they uploaded in accessible workspaces
CREATE POLICY "Users can delete their files in accessible workspaces" 
  ON public.files 
  FOR DELETE 
  USING (
    uploaded_by = auth.uid() AND
    public.user_has_workspace_access(workspace_id, auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX idx_files_workspace_id ON public.files(workspace_id);
CREATE INDEX idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX idx_files_block_id ON public.files(block_id);
CREATE INDEX idx_files_storage_path ON public.files(storage_path);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_files_updated_at 
  BEFORE UPDATE ON public.files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
