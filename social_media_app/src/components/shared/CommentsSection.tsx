import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared";
import { useGetComments } from "@/lib/react-query/commentQueries";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

type CommentsSectionProps = {
  postId: string;
  className?: string;
};

const CommentsSection = ({ postId, className = "" }: CommentsSectionProps) => {
  const [showAllComments, setShowAllComments] = useState(true); // Show all comments by default in PostDetails
  const { 
    data: comments, 
    isLoading: commentsLoading, 
    error: commentsError 
  } = useGetComments(postId);
  // Show loading state
  if (commentsLoading) {
    return (
      <div className={`comments-section ${className}`}>
        <div className="flex items-center justify-center py-4">
          <Loader />
        </div>
      </div>
    );
  }

  // Show error state
  if (commentsError) {
    return (
      <div className={`comments-section ${className}`}>
        <div className="text-center py-4">
          <p className="text-light-3 small-medium">Failed to load comments</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-primary-500 hover:text-primary-400 mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  const displayedComments = comments || [];
  const hasComments = displayedComments.length > 0;
  
  // For display purposes, show first 3 comments unless "show all" is clicked
  const commentsToShow = showAllComments ? displayedComments : displayedComments.slice(0, 3);
  const hasMoreComments = displayedComments.length > 3;

  const handleCommentSuccess = () => {
    // Comment added successfully - no need to hide form in PostDetails
  };return (
      <div className={`comments-section ${className}`}>
        {/* Comment Form - Always visible at top */}
        <div className="mb-6">
          <CommentForm
            postId={postId}
            onSuccess={handleCommentSuccess}
            placeholder="Add a comment..."
          />
        </div>

        {/* Comments List */}
        {hasComments ? (
          <div className="space-y-6">
            {commentsToShow.map((comment) => (
              <div key={comment.id} className="comment-item">
                <CommentItem
                  comment={comment}
                  postId={postId}
                />
              </div>
            ))}

            {/* Show More/Less Button */}
            {hasMoreComments && (
              <div className="text-center py-4 border-t border-dark-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-primary-500 hover:text-primary-400"
                >
                  {showAllComments 
                    ? "Show Less" 
                    : `Show ${displayedComments.length - 3} More Comments`}
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-12">
            <img 
              src="/assets/icons/chat.svg" 
              alt="no comments" 
              width={48} 
              height={48}
              className="opacity-30 mx-auto mb-4"
            />
            <p className="text-light-2 base-medium mb-2">No comments yet</p>
            <p className="text-light-3 small-regular">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    );
  };

export default CommentsSection;
