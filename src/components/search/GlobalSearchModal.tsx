
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, FileText, Hash } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  type: 'page' | 'block';
  id: string;
  title: string;
  workspace_id: string;
  created_by: string;
  created_at: string;
  display_title: string;
  display_content: string;
  rank: number;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const performSearch = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('global_search', {
        search_query: query.trim(),
        user_workspace_id: workspaceId || null
      });

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults(data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleResultSelect = (result: SearchResult) => {
    if (result.type === 'page') {
      navigate(`/workspace/${result.workspace_id}/page/${result.id}`);
    } else if (result.type === 'block') {
      // For blocks, we need to find the page they belong to
      // The result.title is actually the page title for blocks
      navigate(`/workspace/${result.workspace_id}/page/${result.id}`);
    }
    onClose();
    setSearchQuery('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSearchQuery('');
      setResults([]);
    }
  };

  const formatContent = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    return content.length > maxLength 
      ? `${content.substring(0, maxLength)}...` 
      : content;
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search pages and content..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}
        
        {!loading && searchQuery && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        
        {!loading && results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((result) => (
              <CommandItem
                key={`${result.type}-${result.id}`}
                onSelect={() => handleResultSelect(result)}
                className="flex items-start gap-3 py-3"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {result.type === 'page' ? (
                    <FileText className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Hash className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {result.display_title}
                  </div>
                  {result.display_content && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatContent(result.display_content)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.type === 'page' ? 'Page' : 'Block'}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
