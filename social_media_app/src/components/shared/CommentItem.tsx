import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { useUpdateComment, useDeleteComment, useLikeComment } from "@/lib/react-query/commentQueries";
import { multiFormatDateString } from "@/lib/utils";
import { IComment } from "@/types";
import CommentForm from "./CommentForm";

type CommentItemProps = {
  comment: IComment;
  postId: string;
  isReply?: boolean;
  onReply?: (commentId: string) => void;
};

const CommentItem = ({ comment, postId, isReply = false, onReply }: CommentItemProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const likeCommentMutation = useLikeComment();

  const isOwner = user.id === comment.user_id;
  const isLiked = comment.likes?.includes(user.id) || false;
  const likesCount = comment.likes?.length || 0;

  const handleLike = async () => {
    const currentLikes = comment.likes || [];
    const newLikes = isLiked 
      ? currentLikes.filter(id => id !== user.id)
      : [...currentLikes, user.id];

    try {
      await likeCommentMutation.mutateAsync({
        commentId: comment.id,
        likesArray: newLikes
      });
    } catch (error) {
      console.error('Like error:', error);
      toast({
        title: "Failed to update like",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (editContent.length > 500) {
      toast({
        title: "Comment too long",
        description: "Comments cannot exceed 500 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment.id,
        content: editContent.trim()
      });
      
      setIsEditing(false);
      toast({
        title: "Comment updated successfully!"
      });
    } catch (error) {
      toast({
        title: "Failed to update comment",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCommentMutation.mutateAsync(comment.id);
      toast({
        title: "Comment deleted successfully!"
      });
    } catch (error) {
      toast({
        title: "Failed to delete comment",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
    setShowDeleteConfirm(false);
  };

  const handleReply = () => {
    setShowReplyForm(!showReplyForm);
  };

  const handleReplySuccess = () => {
    setShowReplyForm(false);
  };

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-12 border-l border-dark-4 pl-4' : ''}`}>
      {/* User Avatar */}
      <Link to={`/profile/${comment.user.id}`} className="flex-shrink-0">
        <img
          src={comment.user.image_url || "/assets/icons/profile-placeholder.svg"}
          alt={comment.user.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      </Link>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        {/* Comment Header */}
        <div className="flex items-center gap-2 mb-1">
          <Link to={`/profile/${comment.user.id}`}>
            <span className="small-medium text-light-1 hover:text-primary-500 transition-colors">
              {comment.user.name}
            </span>
          </Link>
          <Link to={`/profile/${comment.user.id}`}>
            <span className="tiny-medium text-light-3 hover:text-light-2 transition-colors">
              @{comment.user.username}
            </span>
          </Link>
          <span className="text-light-4">•</span>
          <span className="tiny-medium text-light-3">
            {multiFormatDateString(comment.created_at)}
          </span>
          {comment.is_edited && (
            <>
              <span className="text-light-4">•</span>
              <span className="tiny-medium text-light-3">edited</span>
            </>
          )}
        </div>

        {/* Comment Body */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 bg-dark-3 border border-dark-4 rounded text-light-1 placeholder-light-3 resize-none min-h-[60px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${
                editContent.length > 500 ? 'text-red-500' : 
                editContent.length > 450 ? 'text-yellow-500' : 
                'text-light-3'
              }`}>
                {editContent.length}/500
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="text-light-3 hover:text-light-1 h-8 px-3"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editContent.trim() || editContent.length > 500 || updateCommentMutation.isLoading}
                  className="shad-button_primary h-8 px-3"
                >
                  {updateCommentMutation.isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="small-regular text-light-2 mb-2 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}

        {/* Comment Actions */}
        {!isEditing && (
          <div className="flex items-center gap-4 mb-3">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={likeCommentMutation.isLoading}
              className="flex items-center gap-1 text-light-3 hover:text-primary-500 transition-colors disabled:opacity-50"
            >
              <img
                src={isLiked ? "/assets/icons/liked.svg" : "/assets/icons/like.svg"}
                alt="like"
                width={16}
                height={16}
                className={isLiked ? "filter-primary" : ""}
              />
              {likesCount > 0 && (
                <span className="tiny-medium">{likesCount}</span>
              )}
            </button>

            {/* Reply Button - Now available for all comments */}
            <button
              onClick={handleReply}
              className="text-light-3 hover:text-primary-500 transition-colors tiny-medium"
            >
              Reply
            </button>

            {/* Edit/Delete Buttons */}
            {isOwner && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-light-3 hover:text-primary-500 transition-colors tiny-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-light-3 hover:text-red-500 transition-colors tiny-medium"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mb-4">
            <CommentForm
              postId={postId}
              parentId={isReply ? (comment.parent_id || comment.id) : comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.user.name}...`}
              buttonText="Reply"
              autoFocus
            />
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-3 p-3 bg-dark-4 border border-red-500/30 rounded-lg">
            <p className="small-medium text-light-2 mb-3">
              Are you sure you want to delete this comment? This action cannot be undone.
              {comment.replies && comment.replies.length > 0 && (
                <span className="text-red-400">
                  <br />This will also delete {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}.
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-light-3 hover:text-light-1 h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCommentMutation.isLoading}
                className="h-8 px-3"
              >
                {deleteCommentMutation.isLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && !isReply && (
          <div className="space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                isReply={true}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;