import { useState, useEffect } from 'react';
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
  const { sendMentionNotification, extractMentions } = useMentionNotifications();

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

      // Handle mentions in the comment
      const mentions = extractMentions(body);
      if (mentions.length > 0) {
        try {
          // Get page information for the notification
          const { data: blockData } = await supabase
            .from('blocks')
            .select('page_id')
            .eq('id', blockId)
            .single();

          if (blockData) {
            const { data: pageData } = await supabase
              .from('pages')
              .select('title, workspace_id')
              .eq('id', blockData.page_id)
              .single();

            if (pageData) {
              const pageUrl = `${window.location.origin}/workspace/${pageData.workspace_id}/page/${blockData.page_id}`;
              
              // Send notifications to mentioned users
              for (const email of mentions) {
                try {
                  await sendMentionNotification(
                    email,
                    body,
                    pageData.title,
                    pageUrl
                  );
                } catch (notificationError) {
                  console.warn(`Failed to send notification to ${email}:`, notificationError);
                  // Don't fail the comment creation if notification fails
                }
              }
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
    if (!blockId || !user) return;

    fetchComments();

    // Set up realtime subscription for comments
    const channel = supabase
      .channel(`comments-${blockId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `block_id=eq.${blockId}`
        },
        (payload) => {
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
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, blockId]);

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
