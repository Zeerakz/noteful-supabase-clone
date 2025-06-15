
import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { RelationFieldSettings } from '@/types/database';
import { Block } from '@/types/block';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RelationFieldDisplayProps {
  value: string | string[] | null; // Ignored, kept for compatibility
  settings: RelationFieldSettings;
  pageId: string;
  fieldId: string;
}

export function RelationFieldDisplay({ value, settings, pageId, fieldId }: RelationFieldDisplayProps) {
  const [relatedPages, setRelatedPages] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleOpenPeek = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    const newParams = new URLSearchParams(searchParams);
    newParams.set('peek', pageId);
    navigate({ search: newParams.toString() }, { replace: true });
  };

  const getDisplayText = (page: Block) => {
    return (page.properties as any)?.title || 'Untitled';
  };

  const fetchRelatedPages = useCallback(async () => {
    if (!pageId || !fieldId) {
      setRelatedPages([]);
      return;
    }
    setLoading(true);
    try {
      // Fetch related page IDs from the new page_relations table
      const { data: relationData, error: relationError } = await supabase
        .from('page_relations')
        .select('to_page_id')
        .eq('from_page_id', pageId)
        .eq('relation_property_id', fieldId);

      if (relationError) throw relationError;

      const relatedIds = relationData.map(r => r.to_page_id);

      if (relatedIds.length === 0) {
        setRelatedPages([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('blocks')
        .select('id, type, properties, created_time')
        .in('id', relatedIds)
        .eq('type', 'page');

      if (error) throw error;
      setRelatedPages(data as Block[] || []);
    } catch (err) {
      console.error('Error fetching related pages:', err);
      setRelatedPages([]);
    } finally {
      setLoading(false);
    }
  }, [pageId, fieldId]);

  useEffect(() => {
    fetchRelatedPages();

    if (!pageId || !fieldId) return;

    const channel = supabase
      .channel(`relation-display-${pageId}-${fieldId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_relations',
          filter: `from_page_id=eq.${pageId}`,
        },
        (payload) => {
          const record = payload.new || payload.old;
          if ((record as any)?.relation_property_id === fieldId) {
            fetchRelatedPages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, fieldId, fetchRelatedPages]);


  if (loading) {
    return <span className="text-muted-foreground text-xs">Loading...</span>;
  }

  if (!relatedPages.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 items-center">
        {relatedPages.map((page) => (
          <Tooltip key={page.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs"
                onClick={(e) => handleOpenPeek(e, page.id)}
                aria-label={`Open ${getDisplayText(page)}`}
              >
                {getDisplayText(page)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open page: {getDisplayText(page)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
