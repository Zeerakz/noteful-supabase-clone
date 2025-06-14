
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { RelationFieldSettings } from '@/types/database';
import { Page } from '@/types/page';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RelationFieldDisplayProps {
  value: string | string[] | null;
  settings: RelationFieldSettings;
}

export function RelationFieldDisplay({ value, settings }: RelationFieldDisplayProps) {
  const [relatedPages, setRelatedPages] = useState<Page[]>([]);
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
      if (!value || !settings.target_database_id) {
        setRelatedPages([]);
        return;
      }

      setLoading(true);
      try {
        const valueArray = Array.isArray(value) ? value : [value];
        
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .in('id', valueArray)
          .eq('database_id', settings.target_database_id);

        if (error) throw error;
        setRelatedPages(data || []);
      } catch (err) {
        console.error('Error fetching related pages:', err);
        setRelatedPages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedPages();
  }, [value, settings.target_database_id]);

  if (loading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  if (!relatedPages.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  const getDisplayText = (page: Page) => {
    return page.title;
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
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => handleOpenPeek(e, page.id)}
                  aria-label={`Open ${getDisplayText(page)}`}
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
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
