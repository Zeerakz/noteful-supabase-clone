
-- Create page_properties table to store database field values for pages
CREATE TABLE public.page_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS on page_properties table
ALTER TABLE public.page_properties ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view page properties in their workspaces
CREATE POLICY "Users can view page properties in accessible workspaces" ON public.page_properties
  FOR SELECT TO authenticated
  USING (
    -- Users can view page properties if they have access to the page
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_properties.page_id 
      AND p.created_by = auth.uid()
    )
  );

-- Create policy for users to create page properties
CREATE POLICY "Users can create page properties" ON public.page_properties
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_properties.page_id 
      AND p.created_by = auth.uid()
    )
  );

-- Create policy for users to update page properties
CREATE POLICY "Users can update their page properties" ON public.page_properties
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_properties.page_id 
      AND p.created_by = auth.uid()
    )
  );

-- Create policy for users to delete page properties
CREATE POLICY "Users can delete their page properties" ON public.page_properties
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pages p 
      WHERE p.id = page_properties.page_id 
      AND p.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_page_properties_page_id ON public.page_properties(page_id);
CREATE INDEX idx_page_properties_field_id ON public.page_properties(field_id);
CREATE INDEX idx_page_properties_created_by ON public.page_properties(created_by);

-- Create unique constraint to ensure one value per page per field
CREATE UNIQUE INDEX idx_page_properties_unique_page_field ON public.page_properties(page_id, field_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_page_properties_updated_at 
  BEFORE UPDATE ON public.page_properties 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
