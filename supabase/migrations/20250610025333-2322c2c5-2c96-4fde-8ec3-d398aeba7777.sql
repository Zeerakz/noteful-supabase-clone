
-- Create templates table
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content jsonb NOT NULL,
  workspace_id uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraint to workspaces
ALTER TABLE public.templates 
ADD CONSTRAINT templates_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates based on workspace membership
CREATE POLICY "Users can view templates in their workspaces" 
ON public.templates 
FOR SELECT 
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
  )
);

CREATE POLICY "Editors and admins can create templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    JOIN public.roles r ON wm.role_id = r.id
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
    AND r.role_name IN ('editor', 'admin')
  )
  AND auth.uid() = created_by
);

CREATE POLICY "Editors and admins can update templates" 
ON public.templates 
FOR UPDATE 
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    JOIN public.roles r ON wm.role_id = r.id
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
    AND r.role_name IN ('editor', 'admin')
  )
);

CREATE POLICY "Admins can delete templates" 
ON public.templates 
FOR DELETE 
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    JOIN public.roles r ON wm.role_id = r.id
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
    AND r.role_name = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
