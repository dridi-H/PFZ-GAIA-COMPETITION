import { Link } from "react-router-dom";
import { Loader } from "@/components/shared";
import { useGetCurrentUser, useGetLikedPosts } from "@/lib/react-query/queries";

// Simple liked posts grid component
const LikedPostsGrid = ({ posts }: { posts: any[] }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full">
        <img 
          src="/assets/icons/like.svg" 
          alt="No liked posts"
          className="w-16 h-16 mb-4 opacity-50"
        />
        <h3 className="h3-bold text-light-1 mb-2">No liked posts yet</h3>
        <p className="body-medium text-light-3 text-center">
          Posts you like will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
      {posts.map((post) => {
        const postId = post.id || post.$id;
        const imageUrl = post.image_url || post.imageUrl;
        const creatorData = typeof post.creator === 'object' ? post.creator : null;
        
        return (
          <Link 
            key={postId}
            to={`/posts/${postId}`}
            className="relative aspect-square group cursor-pointer"
          >
            <img
              src={imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="liked post"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = "/assets/icons/profile-placeholder.svg";
              }}
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-2 text-white">
                <img src="/assets/icons/like.svg" alt="liked" className="w-6 h-6" />
                {creatorData && (
                  <p className="text-xs text-center">by @{creatorData.username || creatorData.name}</p>
                )}
              </div>
            </div>
            
            {/* Liked indicator */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1">
              <img src="/assets/icons/like.svg" alt="liked" className="w-4 h-4" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

const LikedPosts = () => {
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser();
  
  // Use a dedicated query for liked posts instead of relying on currentUser.liked
  const { data: likedPosts, isLoading: likedPostsLoading } = useGetLikedPosts(currentUser?.id);

  // Add debug logging
  console.log('🔍 LikedPosts Debug:', {
    currentUser: currentUser,
    currentUserLiked: currentUser?.liked,
    likedPosts: likedPosts,
    userLoading,
    likedPostsLoading
  });

  if (userLoading || likedPostsLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-4">Please sign in to view liked posts</p>
      </div>
    );
  }

  // Use the dedicated liked posts data
  const postsToShow = likedPosts?.documents || [];

  return (
    <div className="w-full flex justify-center max-w-5xl">
      <LikedPostsGrid posts={postsToShow} />
    </div>
  );
};

export default LikedPosts;