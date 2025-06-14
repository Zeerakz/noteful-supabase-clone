import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMentionNotifications } from './useMentionNotifications';

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
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const blockIdRef = useRef<string | undefined>(blockId);

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
          // Get page information for the notification.
          // We assume the block's direct parent is the page. This might not be true for nested blocks.
          const { data: blockData } = await supabase
            .from('blocks')
            .select('parent_id, workspace_id')
            .eq('id', blockId)
            .single();

          if (blockData?.parent_id) {
            const { data: pageData } = await supabase
              .from('blocks')
              .select('properties')
              .eq('id', blockData.parent_id)
              .single();

            if (pageData) {
              const pageUrl = `${window.location.origin}/workspace/${blockData.workspace_id}/page/${blockData.parent_id}`;
              const pageProperties = pageData.properties as { title?: string };
              // Call notifyMention with the list of mentioned emails
              await notifyMention(mentionedEmails, body, pageProperties?.title || 'Untitled', pageUrl);
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

  const cleanup = useCallback(() => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        console.log('Cleaning up comments channel subscription');
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        isSubscribedRef.current = false;
      } catch (error) {
        console.warn('Error removing comments channel:', error);
      }
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!blockId || !user) {
      cleanup();
      setComments([]);
      return;
    }

    // Only create new subscription if block changed
    if (blockIdRef.current === blockId && channelRef.current && isSubscribedRef.current) {
      return;
    }

    fetchComments();

    // Cleanup existing subscription
    cleanup();
    blockIdRef.current = blockId;

    // Create unique channel name with random component
    const randomId = Math.random().toString(36).substring(7);
    const channelName = `comments:${blockId}:${user.id}:${randomId}`;
    console.log('Creating comments channel:', channelName);

    // Set up realtime subscription for comments
    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `block_id=eq.${blockId}`
      },
      (payload) => {
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
      }
    );

    // Subscribe only once and track status
    channel.subscribe((status) => {
      console.log('Comments subscription status:', status, 'for channel:', channelName);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
        if (channelRef.current === channel) {
          channelRef.current = null;
        }
      }
    });

    channelRef.current = channel;

    return cleanup;
  }, [user?.id, blockId, cleanup]);

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
