import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { RelationFieldSettings } from '@/types/database';
import { Page } from '@/types/page';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

  if (relatedPages.length === 1) {
    return (
      <Badge variant="outline" className="text-xs">
        {getDisplayText(relatedPages[0])}
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {relatedPages.map((page) => (
        <Badge
          key={page.id}
          variant="outline"
          className="text-xs cursor-pointer hover:bg-accent"
          onClick={(e) => handleOpenPeek(e, page.id)}
        >
          {getDisplayText(page)}
        </Badge>
      ))}
    </div>
  );
}
