
-- Create a table for file attachments linked to property values
CREATE TABLE public.property_file_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  field_id UUID NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  workspace_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add foreign key constraints
  CONSTRAINT fk_property_file_attachments_page_id 
    FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_file_attachments_field_id 
    FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_file_attachments_workspace_id 
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_file_attachments_uploaded_by 
    FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add RLS policies for property file attachments
ALTER TABLE public.property_file_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view files in workspaces they have access to
CREATE POLICY "Users can view property files in accessible workspaces" 
  ON public.property_file_attachments 
  FOR SELECT 
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- Users can upload files to workspaces they can edit
CREATE POLICY "Users can upload property files to editable workspaces" 
  ON public.property_file_attachments 
  FOR INSERT 
  WITH CHECK (
    public.user_can_edit_workspace(workspace_id, auth.uid()) AND
    uploaded_by = auth.uid()
  );

-- Users can update files they uploaded in workspaces they can edit
CREATE POLICY "Users can update their property files in editable workspaces" 
  ON public.property_file_attachments 
  FOR UPDATE 
  USING (
    uploaded_by = auth.uid() AND
    public.user_can_edit_workspace(workspace_id, auth.uid())
  );

-- Users can delete files they uploaded in workspaces they can edit
CREATE POLICY "Users can delete their property files in editable workspaces" 
  ON public.property_file_attachments 
  FOR DELETE 
  USING (
    uploaded_by = auth.uid() AND
    public.user_can_edit_workspace(workspace_id, auth.uid())
  );

-- Create updated_at trigger
CREATE TRIGGER update_property_file_attachments_updated_at
  BEFORE UPDATE ON public.property_file_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update storage policies for property files
CREATE POLICY "Users can view property files in storage" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'planna_uploads' AND
    EXISTS (
      SELECT 1 FROM public.property_file_attachments pfa
      WHERE pfa.storage_path = name
      AND public.user_has_workspace_access(pfa.workspace_id, auth.uid())
    )
  );
