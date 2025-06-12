
-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('planna_uploads', 'planna_uploads', false);

-- Create policies for the storage bucket
CREATE POLICY "Users can view files in accessible workspaces" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'planna_uploads' AND
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = name
      AND public.user_has_workspace_access(f.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can upload files to accessible workspaces" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'planna_uploads' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their files in accessible workspaces" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'planna_uploads' AND
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = name
      AND f.uploaded_by = auth.uid()
      AND public.user_has_workspace_access(f.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete their files in accessible workspaces" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'planna_uploads' AND
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = name
      AND f.uploaded_by = auth.uid()
      AND public.user_has_workspace_access(f.workspace_id, auth.uid())
    )
  );
