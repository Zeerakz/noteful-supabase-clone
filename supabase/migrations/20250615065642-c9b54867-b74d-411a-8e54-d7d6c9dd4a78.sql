
CREATE OR REPLACE FUNCTION public.update_block_teamspace_recursive(p_block_id uuid, p_teamspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    WITH RECURSIVE descendant_blocks AS (
        SELECT id FROM public.blocks WHERE id = p_block_id
        UNION
        SELECT b.id FROM public.blocks b
        INNER JOIN descendant_blocks db ON b.parent_id = db.id
    )
    UPDATE public.blocks
    SET teamspace_id = p_teamspace_id
    WHERE id IN (SELECT id FROM descendant_blocks);
END;
$$;
