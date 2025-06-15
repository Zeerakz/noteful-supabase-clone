
-- Create the page_relations table to store links between pages for relation properties
CREATE TABLE public.page_relations (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    from_page_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
    to_page_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
    relation_property_id uuid NOT NULL REFERENCES public.database_properties(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT unique_relation_entry UNIQUE (from_page_id, to_page_id, relation_property_id)
);

-- Add comments to explain the table and columns
COMMENT ON TABLE public.page_relations IS 'Stores the links between pages for relation properties.';
COMMENT ON COLUMN public.page_relations.from_page_id IS 'The page where the relation property is defined.';
COMMENT ON COLUMN public.page_relations.to_page_id IS 'The page being linked to from the target database.';
COMMENT ON COLUMN public.page_relations.relation_property_id IS 'The ID of the relation property field in the database_properties table.';

-- Enable Row-Level Security
ALTER TABLE public.page_relations ENABLE ROW LEVEL SECURITY;

-- Allow users to view relations if they can access the workspace of the source page
CREATE POLICY "Users can view relations in their accessible workspaces"
ON public.page_relations FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.blocks b
        WHERE b.id = from_page_id AND public.user_has_workspace_access(b.workspace_id, auth.uid())
    )
);

-- Allow users to insert relations if they have edit rights on the workspace of the source page
CREATE POLICY "Users can create relations in their editable workspaces"
ON public.page_relations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.blocks b
        WHERE b.id = from_page_id AND public.user_can_edit_workspace(b.workspace_id, auth.uid())
    )
);

-- Allow users to delete relations if they have edit rights on the workspace of the source page
CREATE POLICY "Users can delete relations in their editable workspaces"
ON public.page_relations FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.blocks b
        WHERE b.id = from_page_id AND public.user_can_edit_workspace(b.workspace_id, auth.uid())
    )
);
