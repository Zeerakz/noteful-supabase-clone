
import React, { useState } from 'react';
import { Comment } from '@/hooks/useComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit3, Reply } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CommentItemProps {
  comment: Comment;
  onUpdate: (id: string, body: string) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  onReply: (body: string, parentId: string) => Promise<{ error: string | null }>;
  replies?: Comment[];
  level?: number;
}

export function CommentItem({ 
  comment, 
  onUpdate, 
  onDelete, 
  onReply, 
  replies = [], 
  level = 0 
}: CommentItemProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [replyBody, setReplyBody] = useState('');

  const isOwner = user?.id === comment.user_id;
  const maxLevel = 2; // Limit nesting to prevent deep threading

  const handleUpdate = async () => {
    if (editBody.trim() === comment.body) {
      setIsEditing(false);
      return;
    }

    const { error } = await onUpdate(comment.id, editBody.trim());
    if (!error) {
      setIsEditing(false);
    }
  };

  const handleReply = async () => {
    if (!replyBody.trim()) return;

    const { error } = await onReply(replyBody.trim(), comment.id);
    if (!error) {
      setReplyBody('');
      setIsReplying(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await onDelete(comment.id);
    }
  };

  return (
    <div className={`border-l-2 border-border pl-4 ${level > 0 ? 'ml-4' : ''}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleString()}
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-6 w-6 p-0"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate}>
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setEditBody(comment.body);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">{comment.body}</div>
        )}

        {!isEditing && level < maxLevel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReplying(!isReplying)}
            className="h-6 text-xs"
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </Button>
        )}

        {isReplying && (
          <div className="space-y-2 mt-2">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleReply}>
                Reply
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsReplying(false);
                  setReplyBody('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Render replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onReply={onReply}
                level={level + 1}
                replies={[]} // For simplicity, limit to one level of replies for now
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
