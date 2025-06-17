
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMentionNotifications } from './useMentionNotifications';
import { useStableSubscription } from '@/hooks/useStableSubscription';

export interface Comment {
  id: string;
  block_id: string;
  user_id: string;
  body: string;
  parent_comment_id?: string;
  created_at: string;
}

export function useComments(blockId?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { extractMentions, notifyMention } = useMentionNotifications();
  const mountedRef = useRef(true);

  const fetchComments = async () => {
    if (!blockId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('block_id', blockId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    console.log('Realtime comments update:', payload);
    
    if (payload.eventType === 'INSERT') {
      const newComment = payload.new as Comment;
      setComments(prev => {
        if (prev.some(comment => comment.id === newComment.id)) {
          return prev;
        }
        return [...prev, newComment].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    } else if (payload.eventType === 'UPDATE') {
      const updatedComment = payload.new as Comment;
      setComments(prev => prev.map(comment => 
        comment.id === updatedComment.id ? updatedComment : comment
      ));
    } else if (payload.eventType === 'DELETE') {
      const deletedComment = payload.old as Comment;
      setComments(prev => prev.filter(comment => comment.id !== deletedComment.id));
    }
  }, []);

  // Set up realtime subscription
  const subscriptionConfig = blockId && user ? {
    table: 'comments',
    filter: `block_id=eq.${blockId}`,
  } : null;

  useStableSubscription(subscriptionConfig, handleRealtimeUpdate, [blockId, user?.id]);

  const createComment = async (body: string, parentCommentId?: string) => {
    if (!user || !blockId) return { error: 'User not authenticated or block not selected' };

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            block_id: blockId,
            user_id: user.id,
            body,
            parent_comment_id: parentCommentId || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      setComments(prev => [...prev, data]);

      // Extract mentions from the comment body and send notifications
      const mentionedEmails = extractMentions(body);
      if (mentionedEmails.length > 0) {
        try {
          // Get the page information for notifications
          // First, find the root page by traversing up the block hierarchy
          const { data: blockData } = await supabase
            .from('blocks')
            .select('id, parent_id, workspace_id, properties, type')
            .eq('id', blockId)
            .single();

          if (blockData) {
            let currentBlock = blockData;
            
            // Traverse up to find the root page
            while (currentBlock.parent_id && currentBlock.type !== 'page') {
              const { data: parentData } = await supabase
                .from('blocks')
                .select('id, parent_id, workspace_id, properties, type')
                .eq('id', currentBlock.parent_id)
                .single();
              
              if (parentData) {
                currentBlock = parentData;
              } else {
                break;
              }
            }

            // If we found a page block or reached the root, use it for the notification
            if (currentBlock.type === 'page' || !currentBlock.parent_id) {
              const pageUrl = `${window.location.origin}/workspace/${currentBlock.workspace_id}/page/${currentBlock.id}`;
              const pageTitle = currentBlock.properties?.title || 'Untitled';
              
              await notifyMention(mentionedEmails, body, pageTitle, pageUrl);
            }
          }
        } catch (mentionError) {
          console.warn('Failed to process mentions:', mentionError);
          // Don't fail the comment creation if mention processing fails
        }
      }

      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create comment';
      return { data: null, error };
    }
  };

  const updateComment = async (id: string, body: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ body })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setComments(prev => prev.map(comment => 
        comment.id === id ? data : comment
      ));
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update comment';
      return { data: null, error };
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setComments(prev => prev.filter(comment => comment.id !== id));
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete comment';
      return { error };
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (!blockId || !user) {
      setComments([]);
      return;
    }

    fetchComments();

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, blockId]);

  return {
    comments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment,
    fetchComments,
  };
}
