import { Link } from "react-router-dom";
import { Loader } from "@/components/shared";
import { useGetCurrentUser, useGetSavedPosts } from "@/lib/react-query/queries";
// Simple saved posts grid component
const SavedPostsGrid = ({ posts }: { posts: any[] }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full">
        <img 
          src="/assets/icons/save.svg" 
          alt="No saved posts"
          className="w-16 h-16 mb-4 opacity-50 invert-white"
        />
        <h3 className="h3-bold text-light-1 mb-2">No saved posts yet</h3>
        <p className="body-medium text-light-3 text-center">
          Posts you save will appear here.
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
              alt="saved post"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = "/assets/icons/profile-placeholder.svg";
              }}
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-2 text-white">
                <div className="w-6 h-6 bg-primary-500 rounded-sm flex items-center justify-center">
                  <img src="/assets/icons/save.svg" alt="saved" className="w-4 h-4 invert" />
                </div>
                {creatorData && (
                  <p className="text-xs text-center">by @{creatorData.username || creatorData.name}</p>
                )}
              </div>
            </div>
            
            {/* Saved indicator */}
            <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-2">
              <img src="/assets/icons/save.svg" alt="saved" className="w-3 h-3 invert" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

const Saved = () => {
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser();
  const { data: savedPosts, isLoading: savedPostsLoading } = useGetSavedPosts(currentUser?.id);

  // Debug logging
  console.log('🔍 Saved Component Debug:', {
    currentUser: currentUser?.id,
    savedPosts: savedPosts,
    savedPostsCount: savedPosts?.documents?.length || 0,
    userLoading,
    savedPostsLoading
  });

  if (userLoading || savedPostsLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-4">Please sign in to view saved posts</p>
      </div>
    );
  }

  // Use the saved posts from the dedicated query
  const postsToShow = savedPosts?.documents || [];

  return (
    <div className="w-full flex justify-center max-w-5xl">
      <SavedPostsGrid posts={postsToShow} />
    </div>
  );
};

export default Saved;