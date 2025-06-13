
import { useState, useEffect, useCallback } from 'react';
import { NavigationTreeNode, NavigationItem } from '@/types/navigation';
import { NavigationService } from '@/services/navigationService';
import { useToast } from '@/hooks/use-toast';

export function useNavigationTree(workspaceId?: string) {
  const [navigationTree, setNavigationTree] = useState<NavigationTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNavigationTree = useCallback(async () => {
    if (!workspaceId) {
      setNavigationTree([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await NavigationService.getNavigationTree(workspaceId);
      
      if (error) throw new Error(error);
      
      setNavigationTree(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch navigation tree';
      setError(errorMessage);
      console.error('Navigation tree fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const moveNavigationItem = useCallback(async (
    itemId: string,
    newParentId: string | null,
    newIndex: number
  ) => {
    if (!workspaceId) return { error: 'Workspace not selected' };

    try {
      const { error } = await NavigationService.moveNavigationItem(
        itemId,
        newParentId,
        newIndex,
        workspaceId
      );

      if (error) throw new Error(error);

      // Refresh the tree after successful move
      await fetchNavigationTree();
      
      toast({
        title: "Success",
        description: "Navigation item moved successfully",
      });

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move navigation item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: errorMessage };
    }
  }, [workspaceId, fetchNavigationTree, toast]);

  const toggleSectionExpansion = useCallback(async (
    sectionId: string,
    isExpanded: boolean
  ) => {
    try {
      const { error } = await NavigationService.toggleSectionExpansion(sectionId, isExpanded);
      
      if (error) throw new Error(error);

      // Update local state immediately
      setNavigationTree(prevTree => {
        const updateNode = (node: NavigationTreeNode): NavigationTreeNode => {
          if (node.item.id === sectionId && node.item.type === 'section') {
            return { ...node, isExpanded };
          }
          return {
            ...node,
            children: node.children.map(updateNode)
          };
        };
        
        return prevTree.map(updateNode);
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle section expansion';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch navigation tree on mount and when workspaceId changes
  useEffect(() => {
    fetchNavigationTree();
  }, [fetchNavigationTree]);

  return {
    navigationTree,
    loading,
    error,
    fetchNavigationTree,
    moveNavigationItem,
    toggleSectionExpansion,
  };
}
