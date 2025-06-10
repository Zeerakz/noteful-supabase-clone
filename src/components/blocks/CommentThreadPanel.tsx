
import React, { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { MessageSquare, Plus, X, AtSign } from 'lucide-react';

interface CommentThreadPanelProps {
  blockId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function CommentThreadPanel({ blockId, isOpen, onOpenChange, children }: CommentThreadPanelProps) {
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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {/* Add new comment */}
          <div className="space-y-2 mb-4 pb-4 border-b">
            <div className="relative">
              <Textarea
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Add a comment... Use @email@domain.com to mention someone"
                className="min-h-[80px] resize-none"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center gap-1">
                <AtSign className="h-3 w-3" />
                <span>@ to mention</span>
              </div>
            </div>
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
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-sm text-muted-foreground p-4">Loading comments...</div>
            ) : parentComments.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center">
                No comments yet. Be the first to comment!
              </div>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
