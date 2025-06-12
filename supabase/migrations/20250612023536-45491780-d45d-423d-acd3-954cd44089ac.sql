
-- Enable RLS on fields table
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read fields from databases in their workspaces
CREATE POLICY "Users can read fields from their workspace databases" ON public.fields
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspace_membership wm ON d.workspace_id = wm.workspace_id
    WHERE d.id = fields.database_id
    AND wm.user_id = auth.uid()
    AND wm.status = 'accepted'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON d.workspace_id = w.id
    WHERE d.id = fields.database_id
    AND w.owner_user_id = auth.uid()
  )
);

-- Policy to allow users to insert fields in databases they have access to
CREATE POLICY "Users can insert fields in their workspace databases" ON public.fields
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspace_membership wm ON d.workspace_id = wm.workspace_id
    WHERE d.id = fields.database_id
    AND wm.user_id = auth.uid()
    AND wm.status = 'accepted'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON d.workspace_id = w.id
    WHERE d.id = fields.database_id
    AND w.owner_user_id = auth.uid()
  )
);

-- Policy to allow users to update fields in databases they have access to
CREATE POLICY "Users can update fields in their workspace databases" ON public.fields
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspace_membership wm ON d.workspace_id = wm.workspace_id
    WHERE d.id = fields.database_id
    AND wm.user_id = auth.uid()
    AND wm.status = 'accepted'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON d.workspace_id = w.id
    WHERE d.id = fields.database_id
    AND w.owner_user_id = auth.uid()
  )
);

-- Policy to allow users to delete fields in databases they have access to
CREATE POLICY "Users can delete fields in their workspace databases" ON public.fields
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspace_membership wm ON d.workspace_id = wm.workspace_id
    WHERE d.id = fields.database_id
    AND wm.user_id = auth.uid()
    AND wm.status = 'accepted'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.databases d
    JOIN public.workspaces w ON d.workspace_id = w.id
    WHERE d.id = fields.database_id
    AND w.owner_user_id = auth.uid()
  )
);
