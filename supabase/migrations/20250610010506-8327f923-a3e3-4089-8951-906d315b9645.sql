
-- Create fields table to store database field definitions
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  settings JSONB,
  pos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS on fields table
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view fields in their workspaces
CREATE POLICY "Users can view fields in accessible workspaces" ON public.fields
  FOR SELECT TO authenticated
  USING (
    -- Users can view fields if they have access to the workspace containing the database
    created_by = auth.uid()
  );

-- Create policy for users to create fields
CREATE POLICY "Users can create fields" ON public.fields
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Create policy for users to update fields
CREATE POLICY "Users can update their fields" ON public.fields
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Create policy for users to delete fields
CREATE POLICY "Users can delete their fields" ON public.fields
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_fields_database_id ON public.fields(database_id);
CREATE INDEX idx_fields_created_by ON public.fields(created_by);
CREATE INDEX idx_fields_pos ON public.fields(pos);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_fields_updated_at 
  BEFORE UPDATE ON public.fields 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
