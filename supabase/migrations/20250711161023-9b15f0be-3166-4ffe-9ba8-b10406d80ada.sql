-- Clear all data for workspace: 7f0dfe2d-3389-41ab-88fe-af5baef0d714
-- This removes all content while preserving the schema and other workspaces

-- First, get the workspace ID for safety
DO $$
DECLARE
    target_workspace_id uuid := '7f0dfe2d-3389-41ab-88fe-af5baef0d714';
    workspace_exists boolean;
BEGIN
    -- Check if workspace exists
    SELECT EXISTS(SELECT 1 FROM public.workspaces WHERE id = target_workspace_id) INTO workspace_exists;
    
    IF NOT workspace_exists THEN
        RAISE NOTICE 'Workspace % does not exist, skipping cleanup', target_workspace_id;
        RETURN;
    END IF;

    RAISE NOTICE 'Starting cleanup for workspace: %', target_workspace_id;

    -- Delete in reverse dependency order to avoid foreign key violations

    -- 1. Delete saved view permissions (depends on saved_database_views)
    DELETE FROM public.saved_view_permissions 
    WHERE view_id IN (
        SELECT id FROM public.saved_database_views 
        WHERE workspace_id = target_workspace_id
    );
    
    -- 2. Delete field dependencies (depends on database_properties)
    DELETE FROM public.field_dependencies 
    WHERE source_property_id IN (
        SELECT dp.id FROM public.database_properties dp
        JOIN public.databases d ON dp.database_id = d.id
        WHERE d.workspace_id = target_workspace_id
    ) OR dependent_property_id IN (
        SELECT dp.id FROM public.database_properties dp
        JOIN public.databases d ON dp.database_id = d.id
        WHERE d.workspace_id = target_workspace_id
    );

    -- 3. Delete page relations (depends on blocks)
    DELETE FROM public.page_relations 
    WHERE from_page_id IN (
        SELECT id FROM public.blocks 
        WHERE workspace_id = target_workspace_id
    ) OR to_page_id IN (
        SELECT id FROM public.blocks 
        WHERE workspace_id = target_workspace_id
    );

    -- 4. Delete property values (depends on blocks and database_properties)
    DELETE FROM public.property_values 
    WHERE page_id IN (
        SELECT id FROM public.blocks 
        WHERE workspace_id = target_workspace_id
    );

    -- 5. Delete property file attachments
    DELETE FROM public.property_file_attachments 
    WHERE workspace_id = target_workspace_id;

    -- 6. Delete comments (depends on blocks)
    DELETE FROM public.comments 
    WHERE block_id IN (
        SELECT id FROM public.blocks 
        WHERE workspace_id = target_workspace_id
    );

    -- 7. Delete block permissions (depends on blocks)
    DELETE FROM public.block_permissions 
    WHERE block_id IN (
        SELECT id FROM public.blocks 
        WHERE workspace_id = target_workspace_id
    );

    -- 8. Delete group memberships (depends on groups)
    DELETE FROM public.group_memberships 
    WHERE group_id IN (
        SELECT id FROM public.groups 
        WHERE workspace_id = target_workspace_id
    );

    -- 9. Delete teamspace members (depends on teamspaces)
    DELETE FROM public.teamspace_members 
    WHERE teamspace_id IN (
        SELECT id FROM public.teamspaces 
        WHERE workspace_id = target_workspace_id
    );

    -- 10. Delete database properties (depends on databases)
    DELETE FROM public.database_properties 
    WHERE database_id IN (
        SELECT id FROM public.databases 
        WHERE workspace_id = target_workspace_id
    );

    -- 11. Delete saved database views
    DELETE FROM public.saved_database_views 
    WHERE workspace_id = target_workspace_id;

    -- 12. Delete view templates
    DELETE FROM public.view_templates 
    WHERE workspace_id = target_workspace_id;

    -- 13. Delete database views
    DELETE FROM public.database_views 
    WHERE database_id IN (
        SELECT id FROM public.databases 
        WHERE workspace_id = target_workspace_id
    );

    -- 14. Delete files
    DELETE FROM public.files 
    WHERE workspace_id = target_workspace_id;

    -- 15. Delete schema audit log
    DELETE FROM public.schema_audit_log 
    WHERE workspace_id = target_workspace_id;

    -- 16. Delete invitation analytics
    DELETE FROM public.invitation_analytics 
    WHERE workspace_id = target_workspace_id;

    -- 17. Delete invitations
    DELETE FROM public.invitations 
    WHERE workspace_id = target_workspace_id;

    -- 18. Delete templates
    DELETE FROM public.templates 
    WHERE workspace_id = target_workspace_id;

    -- 19. Delete groups
    DELETE FROM public.groups 
    WHERE workspace_id = target_workspace_id;

    -- 20. Delete teamspaces
    DELETE FROM public.teamspaces 
    WHERE workspace_id = target_workspace_id;

    -- 21. Delete blocks (pages and content)
    DELETE FROM public.blocks 
    WHERE workspace_id = target_workspace_id;

    -- 22. Delete databases
    DELETE FROM public.databases 
    WHERE workspace_id = target_workspace_id;

    -- 23. Delete workspace members
    DELETE FROM public.workspace_members 
    WHERE workspace_id = target_workspace_id;

    -- 24. Finally, delete the workspace itself
    DELETE FROM public.workspaces 
    WHERE id = target_workspace_id;

    RAISE NOTICE 'Workspace cleanup completed for: %', target_workspace_id;
END $$;