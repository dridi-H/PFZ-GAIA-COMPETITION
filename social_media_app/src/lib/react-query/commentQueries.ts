import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  createComment, 
  getCommentsByPost, 
  updateComment, 
  deleteComment, 
  likeComment,
  getCommentCount
} from "@/lib/supabase/api";

export const COMMENT_QUERY_KEYS = {
  COMMENTS: "comments",
  COMMENT_COUNT: "commentCount",
  COMMENTS_BY_POST: "commentsByPost"
};

// ============================================================
// COMMENT QUERIES
// ============================================================

// Get comments for a specific post
export const useGetComments = (postId: string) => {
  return useQuery({
    queryKey: [COMMENT_QUERY_KEYS.COMMENTS_BY_POST, postId],
    queryFn: () => getCommentsByPost(postId),
    enabled: !!postId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get comment count for a post
export const useGetCommentCount = (postId: string) => {
  return useQuery({
    queryKey: [COMMENT_QUERY_KEYS.COMMENT_COUNT, postId],
    queryFn: () => getCommentCount(postId),
    enabled: !!postId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// ============================================================
// COMMENT MUTATIONS
// ============================================================

// Create comment mutation
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (data, variables) => {
      // Invalidate and refetch comments for the post
      queryClient.invalidateQueries({
        queryKey: [COMMENT_QUERY_KEYS.COMMENTS_BY_POST, variables.postId]
      });
      
      // Invalidate comment count
      queryClient.invalidateQueries({
        queryKey: [COMMENT_QUERY_KEYS.COMMENT_COUNT, variables.postId]
      });

      // Update comments cache optimistically
      queryClient.setQueryData(
        [COMMENT_QUERY_KEYS.COMMENTS_BY_POST, variables.postId],
        (old: any) => {
          if (!old) return [data];
          
          if (variables.parentId) {
            // This is a reply - add it to the parent's replies
            return old.map((comment: any) => {
              if (comment.id === variables.parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), data]
                };
              }
              return comment;
            });
          } else {
            // This is a root comment - add it to the end
            return [...old, data];
          }
        }
      );
    },
  });
};

// Update comment mutation
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateComment,
    onSuccess: (data, variables) => {
      // Update the specific comment in cache
      queryClient.setQueryData(
        [COMMENT_QUERY_KEYS.COMMENTS_BY_POST, data.post_id],
        (old: any) => {
          if (!old) return old;
          
          const updateCommentInTree = (comments: any[]): any[] => {
            return comments.map(comment => {
              if (comment.id === variables.commentId) {
                return { ...comment, ...data };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentInTree(comment.replies)
                };
              }
              return comment;
            });
          };

          return updateCommentInTree(old);
        }
      );
    },
  });
};

// Delete comment mutation
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, commentId) => {
      // Remove comment from all cached comment lists
      queryClient.setQueriesData(
        { queryKey: [COMMENT_QUERY_KEYS.COMMENTS_BY_POST] },
        (old: any) => {
          if (!old) return old;
          
          const removeCommentFromTree = (comments: any[]): any[] => {
            return comments
              .filter(comment => comment.id !== commentId)
              .map(comment => ({
                ...comment,
                replies: comment.replies ? removeCommentFromTree(comment.replies) : []
              }));
          };

          return removeCommentFromTree(old);
        }
      );

      // Invalidate comment counts
      queryClient.invalidateQueries({
        queryKey: [COMMENT_QUERY_KEYS.COMMENT_COUNT]
      });
    },
  });
};

// Like comment mutation
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, likesArray }: { commentId: string; likesArray: string[] }) =>
      likeComment(commentId, likesArray),
    onMutate: async ({ commentId, likesArray }) => {
      // Optimistically update the cache
      queryClient.setQueriesData(
        { queryKey: [COMMENT_QUERY_KEYS.COMMENTS_BY_POST] },
        (old: any) => {
          if (!old) return old;
          
          const updateCommentLikes = (comments: any[]): any[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return { ...comment, likes: likesArray };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentLikes(comment.replies)
                };
              }
              return comment;
            });
          };

          return updateCommentLikes(old);
        }
      );
    },    onError: (error) => {
      // Revert the optimistic update on error
      console.error('Error liking comment:', error);
    },
  });
};
