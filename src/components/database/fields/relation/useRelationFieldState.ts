
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Block } from '@/types/block';
import { DatabaseField, RelationFieldSettings } from '@/types/database';

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

  // Fetch initial related page IDs
  useEffect(() => {
    const fetchRelations = async () => {
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
    };
    fetchRelations();
  }, [pageId, field.id]);

  // Fetch selected pages details for display
  useEffect(() => {
    const fetchSelectedPages = async () => {
      if (relatedPageIds.length === 0) {
        setSelectedPages([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('blocks')
          .select('*')
          .in('id', relatedPageIds)
          .eq('type', 'page');

        if (error) throw error;
        setSelectedPages((data as Block[]) || []);
      } catch (err) {
        console.error('Error fetching selected pages:', err);
        setSelectedPages([]);
      }
    };

    fetchSelectedPages();
  }, [relatedPageIds]);

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
      // Single selection
      if (relatedPageIds.includes(selectedPageId)) {
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
    handlePageSelect,
    handleRemove,
    field, // Export field for use in dialog
  };
}
