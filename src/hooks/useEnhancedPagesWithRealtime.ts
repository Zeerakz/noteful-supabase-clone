
import { useCallback, useEffect } from 'react';
import { useEnhancedPages } from '@/hooks/useEnhancedPages';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';
import { Block } from '@/types/block';

export function useEnhancedPagesWithRealtime(workspaceId?: string) {
  const pagesHook = useEnhancedPages(workspaceId);
  const { subscribe, addGlobalListener } = useRealtimeManager();

  // Subscribe to workspace-wide page changes
  useEffect(() => {
    if (!workspaceId) return;

    console.log('🔗 Setting up workspace subscription for pages:', workspaceId);

    const unsubscribe = subscribe('workspace', workspaceId, {
      onPageChange: (payload) => {
        console.log('📄 Workspace page change:', payload);
        
        const newPage = payload.new as Block;
        const oldPage = payload.old as Block;
        const eventType = payload.eventType;

        // Handle new pages
        if (eventType === 'INSERT' && newPage?.type === 'page') {
          console.log('✨ New page created:', newPage.properties?.title);
          // Force refresh to ensure new pages appear in navigation
          setTimeout(() => {
            pagesHook.fetchPages();
          }, 100);
        }

        // Handle page updates (like title changes)
        if (eventType === 'UPDATE' && newPage?.type === 'page') {
          console.log('📝 Page updated:', newPage.properties?.title);
          // Refresh to ensure changes are reflected
          setTimeout(() => {
            pagesHook.fetchPages();
          }, 100);
        }

        // Handle page deletions
        if (eventType === 'DELETE' && oldPage?.type === 'page') {
          console.log('🗑️ Page deleted:', oldPage.properties?.title);
          // Refresh to remove deleted pages
          setTimeout(() => {
            pagesHook.fetchPages();
          }, 100);
        }
      },
      onBlockChange: (payload) => {
        // Handle any block changes that might affect page hierarchy
        const newBlock = payload.new as Block;
        const eventType = payload.eventType;
        
        if (eventType === 'INSERT' && newBlock?.type === 'page') {
          console.log('📄 New page block detected, refreshing pages');
          // Force refresh to ensure new pages appear in navigation
          setTimeout(() => {
            pagesHook.fetchPages();
          }, 100);
        }
      },
    });

    return unsubscribe;
  }, [workspaceId, subscribe, pagesHook.fetchPages]);

  // Global coordination for other components
  useEffect(() => {
    const unsubscribeGlobal = addGlobalListener((event) => {
      const { type, id, payload } = event.detail;
      
      if (type === 'workspace' && id === workspaceId) {
        const block = payload.new as Block;
        
        if (payload.eventType === 'INSERT' && block?.type === 'page') {
          console.log('🌍 Global: Coordinating new page creation');
          // Broadcast to other components that a new page was created
          window.dispatchEvent(new CustomEvent('pageCreated', {
            detail: { page: block, workspaceId }
          }));
        }
      }
    });

    return unsubscribeGlobal;
  }, [addGlobalListener, workspaceId]);

  return pagesHook;
}
