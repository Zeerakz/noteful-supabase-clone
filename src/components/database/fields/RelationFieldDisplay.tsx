
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { RelationFieldSettings } from '@/types/database';
import { Block } from '@/types/block';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
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

  useEffect(() => {
    const fetchRelatedPages = async () => {
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
          .select('id, type, properties')
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
    };

    if (pageId && fieldId) {
      fetchRelatedPages();
    }
  }, [pageId, fieldId]);

  if (loading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  if (!relatedPages.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  const getDisplayText = (page: Block) => {
    return (page.properties as any)?.title || 'Untitled';
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 items-center">
        {relatedPages.map((page) => (
          <div key={page.id} className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {getDisplayText(page)}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => handleOpenPeek(e, page.id)}
                  aria-label={`Open ${getDisplayText(page)}`}
                >
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open page</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
