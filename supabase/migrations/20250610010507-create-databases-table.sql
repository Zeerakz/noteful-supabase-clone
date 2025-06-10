
-- Create databases table to store database definitions
CREATE TABLE public.databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS on databases table
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view databases in their workspaces
CREATE POLICY "Users can view databases in accessible workspaces" ON public.databases
  FOR SELECT TO authenticated
  USING (
    -- Users can view databases if they have access to the workspace
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = databases.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

-- Create policy for users to create databases
CREATE POLICY "Users can create databases" ON public.databases
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = databases.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

-- Create policy for users to update databases
CREATE POLICY "Users can update their databases" ON public.databases
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = databases.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

-- Create policy for users to delete databases
CREATE POLICY "Users can delete their databases" ON public.databases
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = databases.workspace_id 
      AND w.owner_user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_databases_workspace_id ON public.databases(workspace_id);
CREATE INDEX idx_databases_created_by ON public.databases(created_by);
CREATE INDEX idx_databases_table_name ON public.databases(table_name);

-- Add foreign key constraint to fields table
ALTER TABLE public.fields ADD CONSTRAINT fields_database_id_fkey 
  FOREIGN KEY (database_id) REFERENCES public.databases(id) ON DELETE CASCADE;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_databases_updated_at 
  BEFORE UPDATE ON public.databases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
