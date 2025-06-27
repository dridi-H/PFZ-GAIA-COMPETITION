import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { checkIsLiked } from "@/lib/utils";
import {
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
} from "@/lib/react-query/queries";
import { useGetCommentCount } from "@/lib/react-query/commentQueries";

type PostStatsProps = {
  post: {
    id: string;
    likes?: string[];
    creator?: {
      id: string;
    };
  };
  userId: string;
  showComments?: boolean;
  onCommentClick?: () => void;
};

const PostStats = ({ post, userId, showComments = false, onCommentClick }: PostStatsProps) => {
  const location = useLocation();
  
  // Safety check for post.likes - handle both array of user IDs or empty
  const likesList = post?.likes || [];
  
  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavePost } = useDeleteSavedPost();
  const { data: commentCount } = useGetCommentCount(post.id);

  const { data: currentUser } = useGetCurrentUser();

  // FIXED: Sync local likes state with prop changes (from cache updates)
  useEffect(() => {
    setLikes(likesList);
    console.log('PostStats likes synced from props:', {
      postId: post?.id,
      newLikes: likesList,
      likesCount: likesList.length
    });
  }, [likesList, post?.id]);

  // Debug logging
  console.log('PostStats Debug:', {
    postId: post?.id,
    currentUser: currentUser?.id,
    saves: currentUser?.saves,
    savedCount: currentUser?.saves?.length || 0,
    likesFromProps: likesList.length,
    likesFromState: likes.length
  });

  // Fixed: Use correct Supabase field names and safety checks
  const savedPostRecord = currentUser?.saves?.find(
    (record: any) => record?.post_id === post?.id
  );

  useEffect(() => {
    setIsSaved(!!savedPostRecord);
    console.log('Save state updated:', {
      postId: post?.id,
      savedPostRecord: savedPostRecord,
      isSaved: !!savedPostRecord
    });
  }, [currentUser, savedPostRecord, post?.id]);

  const handleLikePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    console.log('🚨 LIKE BUTTON CLICKED - HANDLER CALLED!'); // Add this line first
    e.stopPropagation();

    console.log('Debug click data:', { // Add this debug block
      postId: post?.id,
      userId: userId,
      hasPostId: !!post?.id,
      hasUserId: !!userId,
      likesLength: likes.length
    });

    if (!post?.id || !userId) {
      console.log('❌ MISSING DATA - RETURNING EARLY'); // Add this
      return;
    }

    let likesArray = [...likes];

    if (likesArray.includes(userId)) {
      likesArray = likesArray.filter((Id) => Id !== userId);
    } else {
      likesArray.push(userId);
    }

    console.log('Like button clicked:', {
      postId: post.id,
      previousLikes: likes.length,
      newLikes: likesArray.length,
      isLiking: !likes.includes(userId)
    });

    // FIXED: Update local state for immediate UI feedback
    setLikes(likesArray);
    
    // Call mutation (this will invalidate cache and update props)
    likePost({ postId: post.id, likesArray });
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (!post?.id || !userId) {
      console.error('Missing post ID or user ID');
      return;
    }

    console.log('handleSavePost clicked:', {
      postId: post.id,
      userId: userId,
      currentIsSaved: isSaved,
      savedPostRecord: savedPostRecord
    });

    if (savedPostRecord) {
      // Post is already saved, so unsave it
      console.log('Unsaving post...', savedPostRecord.id);
      setIsSaved(false);
      deleteSavePost(savedPostRecord.id);
    } else {
      // Post is not saved, so save it
      console.log('Saving post...');
      setIsSaved(true);
      savePost({ userId: userId, postId: post.id });
    }
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";
    
  return (
    <div
      className={`flex justify-between items-center z-20 ${containerStyles}`}>
      <div className="flex gap-4 mr-5">
        {/* Like Button */}
        <div className="flex gap-2 items-center">
          <img
            src={`${
              checkIsLiked(likes, userId)
                ? "/assets/icons/liked.svg"
                : "/assets/icons/like.svg"
            }`}
            alt="like"
            width={20}
            height={20}
            onClick={(e) => handleLikePost(e)}
            className="cursor-pointer"
          />
          <p className="small-medium lg:base-medium">{likes.length}</p>
        </div>

        {/* Comment Button */}
        {showComments && (
          <div className="flex gap-2 items-center">
            <img
              src="/assets/icons/chat.svg"
              alt="comment"
              width={20}
              height={20}
              onClick={onCommentClick}
              className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            />
            <p className="small-medium lg:base-medium">{commentCount || 0}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <img
          src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
          alt="save"
          width={20}
          height={20}
          className="cursor-pointer"
          onClick={(e) => handleSavePost(e)}
        />
      </div>
    </div>
  );
};

export default PostStats;