// import { useToast } from "@/components/ui/use-toast";
import { Loader, PostCard, UserCard, InlinePostCreator } from "@/components/shared";
import { useGetRecentPosts, useGetUsers } from "@/lib/react-query/queries";
import { Link } from "react-router-dom";

const Home = () => {
  // const { toast } = useToast();

  const {
    data: posts,
    isLoading: isPostLoading,
    isError: isErrorPosts,
    refetch: refetchPosts,
  } = useGetRecentPosts();
  const {
    data: creators,
    isLoading: isUserLoading,
    isError: isErrorCreators,
  } = useGetUsers(10);

  const handlePostCreated = () => {
    // Refresh the posts feed when a new post is created
    refetchPosts();
  };

  if (isErrorPosts || isErrorCreators) {
    return (
      <div className="flex flex-1">
        <div className="home-container">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
        <div className="home-creators">
          <p className="body-medium text-light-1">Something bad happened</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="home-container">        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          
          {/* Inline Post Creator */}
          <InlinePostCreator onPostCreated={handlePostCreated} />
          
          {isPostLoading && !posts ? (
            <Loader />) : posts?.documents && posts.documents.length > 0 ? (
            <ul className="flex flex-col flex-1 gap-9 w-full ">
              {posts?.documents.map((post: any) => (
                <li key={post.id || post.$id} className="flex justify-center w-full">
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          ) : (
            // Empty State for No Posts
            <div className="flex flex-col items-center justify-center h-96">
              <img 
                src="/assets/icons/posts.svg" 
                alt="No posts"
                className="w-16 h-16 mb-4 opacity-50"
              />
              <h3 className="h3-bold text-light-1 mb-2">No posts yet</h3>
              <p className="body-medium text-light-3 text-center mb-6">
                Be the first to share something amazing with the community!
              </p>
              <Link 
                to="/create-post" 
                className="shad-button_primary"
              >
                Create Your First Post
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="home-creators">
        <h3 className="h3-bold text-light-1">Top Creators</h3>
        {isUserLoading && !creators ? (
          <Loader />        ) : creators?.documents && creators.documents.length > 0 ? (
          <ul className="grid 2xl:grid-cols-2 gap-6">
            {creators?.documents.map((creator: any) => (
              <li key={creator?.id || creator?.$id}>
                <UserCard user={creator} />
              </li>
            ))}
          </ul>
        ) : (
          // Empty State for No Creators
          <div className="flex flex-col items-center justify-center h-48">
            <img 
              src="/assets/icons/people.svg" 
              alt="No users"
              className="w-12 h-12 mb-3 opacity-50"
            />
            <p className="body-medium text-light-3 text-center">
              No creators to show yet.<br />
              Start following amazing people!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
