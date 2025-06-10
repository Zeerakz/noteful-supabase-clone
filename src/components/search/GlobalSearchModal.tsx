
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
import { useAuth } from '@/contexts/AuthContext';
import { SearchService, SearchResult } from '@/services/searchService';

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
      const searchResults = await SearchService.globalSearch(query, workspaceId);
      setResults(searchResults);
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

  const handleResultSelect = async (result: SearchResult) => {
    if (result.type === 'page') {
      navigate(`/workspace/${result.workspace_id}/page/${result.id}`);
    } else if (result.type === 'block') {
      // For blocks, we need to find the page they belong to
      const pageId = await SearchService.getBlockPageId(result.id);
      if (pageId) {
        navigate(`/workspace/${result.workspace_id}/page/${pageId}`);
      }
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
                      {SearchService.formatContent(result.display_content)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.type === 'page' ? 'Page' : 'Block'} • Score: {result.rank.toFixed(2)}
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
