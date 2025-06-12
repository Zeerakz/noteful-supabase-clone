
-- Drop existing policies on storage.objects for planna_uploads bucket
DROP POLICY IF EXISTS "Users can view files in accessible workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files to accessible workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their files in accessible workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their files in accessible workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create comprehensive RLS policies for the planna_uploads bucket
-- Policy for viewing files - users can view files in workspaces they have access to
CREATE POLICY "Users can view files in accessible workspaces" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'planna_uploads' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = name
      AND public.user_has_workspace_access(f.workspace_id, auth.uid())
    )
  );

-- Policy for uploading files - authenticated users can upload
CREATE POLICY "Users can upload files to accessible workspaces" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'planna_uploads' AND
    auth.uid() IS NOT NULL
  );

-- Policy for updating files - users can update files they uploaded in accessible workspaces
CREATE POLICY "Users can update their files in accessible workspaces" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'planna_uploads' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = name
      AND f.uploaded_by = auth.uid()
      AND public.user_has_workspace_access(f.workspace_id, auth.uid())
    )
  );

-- Policy for deleting files - users can delete files they uploaded in accessible workspaces
CREATE POLICY "Users can delete their files in accessible workspaces" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'planna_uploads' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.files f
      WHERE f.storage_path = name
      AND f.uploaded_by = auth.uid()
      AND public.user_has_workspace_access(f.workspace_id, auth.uid())
    )
  );
