import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';
import { DatabaseField, RelationFieldSettings } from '@/types/database';
import { useDatabasePages } from '@/hooks/useDatabasePages';

interface UseRelationFieldStateProps {
  pageId: string;
  field: DatabaseField;
  isMultiple: boolean;
  settings: RelationFieldSettings;
  workspaceId: string;
  onCloseDialog?: () => void;
}

export function useRelationFieldState({
  pageId,
  field,
  isMultiple,
  settings,
  workspaceId,
  onCloseDialog,
}: UseRelationFieldStateProps) {
  const [relatedPageIds, setRelatedPageIds] = useState<string[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(true);
  const [selectedPages, setSelectedPages] = useState<Block[]>([]);

  const { pages, loading: loadingTargetPages } = useDatabasePages(settings.target_database_id || '', workspaceId);

  // Fetch initial related page IDs
  const fetchRelations = useCallback(async () => {
    if (!pageId || !field.id) return;
    setLoadingRelations(true);
    try {
      const { data, error } = await supabase
        .from('page_relations')
        .select('to_page_id')
        .eq('from_page_id', pageId)
        .eq('relation_property_id', field.id);

      if (error) throw error;
      
      const ids = data.map(r => r.to_page_id);
      setRelatedPageIds(ids);
    } catch (err) {
      console.error('Error fetching relations:', err);
      setRelatedPageIds([]);
    } finally {
      setLoadingRelations(false);
    }
  }, [pageId, field.id]);

  useEffect(() => {
    fetchRelations();

    if (!pageId || !field.id) return;

    const channel = supabase
      .channel(`relation-editor-${pageId}-${field.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_relations',
          filter: `from_page_id=eq.${pageId}`,
        },
        (payload: any) => {
          if (payload.new?.relation_property_id === field.id || payload.old?.relation_property_id === field.id) {
            console.log('Realtime update for relation editor, refetching...');
            fetchRelations();
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, field.id, fetchRelations]);

  // Update selected pages based on fetched IDs and available pages
  useEffect(() => {
    if (loadingRelations || !pages.length) {
      if (!loadingRelations) setSelectedPages([]);
      return;
    }
    const selected = pages.filter(page => relatedPageIds.includes(page.id));
    setSelectedPages(selected);
  }, [relatedPageIds, pages, loadingRelations]);

  const handleRemove = async (pageIdToRemove: string) => {
    const { error } = await supabase
      .from('page_relations')
      .delete()
      .match({ from_page_id: pageId, to_page_id: pageIdToRemove, relation_property_id: field.id });
    if (!error) {
      setRelatedPageIds(currentIds => currentIds.filter(id => id !== pageIdToRemove));
    }
  };

  const handlePageSelect = async (selectedPageId: string) => {
    if (isMultiple) {
      if (relatedPageIds.includes(selectedPageId)) {
        await handleRemove(selectedPageId);
      } else {
        const { error } = await supabase
          .from('page_relations')
          .insert({ from_page_id: pageId, to_page_id: selectedPageId, relation_property_id: field.id });
        if (!error) {
          setRelatedPageIds(currentIds => [...currentIds, selectedPageId]);
        }
      }
    } else {
      if (relatedPageIds.includes(selectedPageId)) {
        // If the same item is clicked, deselect it
        await handleRemove(selectedPageId);
      } else {
        const { error: deleteError } = await supabase
          .from('page_relations')
          .delete()
          .match({ from_page_id: pageId, relation_property_id: field.id });
        
        if (!deleteError) {
          const { error: insertError } = await supabase
            .from('page_relations')
            .insert({ from_page_id: pageId, to_page_id: selectedPageId, relation_property_id: field.id });
          if (!insertError) {
            setRelatedPageIds([selectedPageId]);
          }
        }
      }
      if (onCloseDialog) onCloseDialog();
    }
  };

  return {
    selectedPages,
    relatedPageIds,
    loadingRelations,
    pages,
    loadingTargetPages,
    handlePageSelect,
    handleRemove,
  };
}
