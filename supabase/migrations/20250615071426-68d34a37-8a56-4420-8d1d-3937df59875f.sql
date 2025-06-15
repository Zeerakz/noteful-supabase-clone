
-- This migration fixes a previously failed migration by using correct table names and policies.
-- It establishes role-based permissions for databases, their properties, and property values.

-- Drop old policies that might exist from previous attempts or old logic.
-- It's safe to drop if they don't exist.
DROP POLICY IF EXISTS "Allow members to view workspace databases" ON public.databases;
DROP POLICY IF EXISTS "Allow admins to create, update, and delete databases" ON public.databases;

DROP POLICY IF EXISTS "Allow members to view database properties" ON public.database_properties;
DROP POLICY IF EXISTS "Allow admins to manage database properties" ON public.database_properties;

DROP POLICY IF EXISTS "Allow members to view property values" ON public.property_values;
DROP POLICY IF EXISTS "Allow editors to manage property values" ON public.property_values;


-- RLS for 'databases' table
ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to view workspace databases"
ON public.databases FOR SELECT
USING (
  public.check_workspace_membership(workspace_id, auth.uid())
);

CREATE POLICY "Allow admins to create, update, and delete databases"
ON public.databases FOR ALL
USING (
  public.check_workspace_membership(workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[])
);


-- RLS for 'database_properties' table (schema definition)
ALTER TABLE public.database_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to view database properties"
ON public.database_properties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    WHERE d.id = database_properties.database_id AND public.check_workspace_membership(d.workspace_id, auth.uid())
  )
);

CREATE POLICY "Allow admins to manage database properties"
ON public.database_properties FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.databases d
    WHERE d.id = database_properties.database_id AND public.check_workspace_membership(d.workspace_id, auth.uid(), ARRAY['owner', 'admin']::public.workspace_role[])
  )
);


-- RLS for 'property_values' table (content data)
ALTER TABLE public.property_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to view property values"
ON public.property_values FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.database_properties dp
    JOIN public.databases d ON d.id = dp.database_id
    WHERE dp.id = property_values.property_id AND public.check_workspace_membership(d.workspace_id, auth.uid())
  )
);

CREATE POLICY "Allow editors to manage property values"
ON public.property_values FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.database_properties dp
    JOIN public.databases d ON d.id = dp.database_id
    WHERE dp.id = property_values.property_id AND public.check_workspace_membership(d.workspace_id, auth.uid(), ARRAY['owner', 'admin', 'member']::public.workspace_role[])
  )
);
