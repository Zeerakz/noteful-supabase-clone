
import React, { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus } from 'lucide-react';

interface CommentsSectionProps {
  blockId: string;
}

export function CommentsSection({ blockId }: CommentsSectionProps) {
  const [showComments, setShowComments] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState('');
  const { comments, loading, createComment, updateComment, deleteComment } = useComments(blockId);

  // Organize comments into threads (parent comments and their replies)
  const parentComments = comments.filter(comment => !comment.parent_comment_id);
  const getReplies = (parentId: string) => 
    comments.filter(comment => comment.parent_comment_id === parentId);

  const handleCreateComment = async () => {
    if (!newCommentBody.trim()) return;

    const { error } = await createComment(newCommentBody.trim());
    if (!error) {
      setNewCommentBody('');
    }
  };

  const handleReply = async (body: string, parentId: string) => {
    return await createComment(body, parentId);
  };

  if (!showComments) {
    return (
      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(true)}
          className="h-6 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          {comments.length > 0 ? `${comments.length} comments` : 'Add comment'}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      {/* Add new comment */}
      <div className="space-y-2 mb-4">
        <Textarea
          value={newCommentBody}
          onChange={(e) => setNewCommentBody(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[60px]"
        />
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleCreateComment}
            disabled={!newCommentBody.trim()}
          >
            <Plus className="h-3 w-3 mr-1" />
            Comment
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading comments...</div>
      ) : parentComments.length === 0 ? (
        <div className="text-sm text-muted-foreground">No comments yet.</div>
      ) : (
        <div className="space-y-4">
          {parentComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onUpdate={updateComment}
              onDelete={deleteComment}
              onReply={handleReply}
              replies={getReplies(comment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
