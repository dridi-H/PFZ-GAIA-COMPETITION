import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
} from "react-router-dom";

import { LikedPosts, Saved } from "@/_root/pages";
import { useUserContext } from "@/context/AuthContext";
import { useGetUserById, useGetUserPosts } from "@/lib/react-query/queries";
import { Loader, FollowButton } from "@/components/shared";
import { useFollowCounts } from "@/lib/react-query/followQueries";

interface StabBlockProps {
  value: string | number;
  label: string;
}

const StatBlock = ({ value, label }: StabBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

// Simple posts list component for profile
const ProfilePosts = ({ posts }: { posts: any[] }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full">
        <img 
          src="/assets/icons/posts.svg" 
          alt="No posts"
          className="w-16 h-16 mb-4 opacity-50"
        />
        <h3 className="h3-bold text-light-1 mb-2">No posts yet</h3>
        <p className="body-medium text-light-3 text-center">
          Posts will appear here when they're created.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {posts.map((post) => {
          // Handle both Supabase (id) and Appwrite ($id) formats
          const postId = post.id || post.$id;
          const imageUrl = post.image_url || post.imageUrl;
          
          return (
            <Link 
              key={postId}
              to={`/posts/${postId}`}
              className="relative aspect-square group cursor-pointer"
            >
              <img
                src={imageUrl || "/assets/icons/profile-placeholder.svg"}
                alt="post"
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "/assets/icons/profile-placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <img src="/assets/icons/like.svg" alt="likes" className="w-5 h-5" />
                    <span className="text-sm">{post.likes?.length || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();

  const { data: currentUser } = useGetUserById(id || "");
  const { data: userPosts } = useGetUserPosts(id || ""); // Added this line to fetch posts separately
  const { data: followCounts } = useFollowCounts(id || "");

  // Debug what we're getting
  console.log('🔍 Profile Debug:', {
    currentUser: currentUser,
    userPosts: userPosts,
    postsCount: userPosts?.documents?.length || 0,
    followCounts: followCounts
  });

  if (!currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={
              currentUser.image_url || "/assets/icons/profile-placeholder.svg"
            }
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full"
          />
          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {currentUser.name}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{currentUser.username}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={userPosts?.documents?.length || 0} label="Posts" />
              <StatBlock value={followCounts?.followers || 0} label="Followers" />
              <StatBlock value={followCounts?.following || 0} label="Following" />
            </div>

            <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
              {currentUser.bio || "No bio available"}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <div className={`${user.id !== currentUser.id && "hidden"}`}>
              <Link
                to={`/update-profile/${currentUser.id}`}
                className={`h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg ${
                  user.id !== currentUser.id && "hidden"
                }`}>
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            </div>

            <div className={`${user.id === id && "hidden"}`}>
              <FollowButton 
                userId={currentUser.id}
                size="medium"
                className="px-8"
              />
            </div>
          </div>
        </div>
      </div>

      {currentUser.id === user.id && (
        <div className="flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${
              pathname === `/profile/${id}` && "!bg-dark-3"
            }`}>
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            Posts
          </Link>
          <Link
            to={`/profile/${id}/liked-posts`}
            className={`profile-tab ${
              pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"
            }`}>
            <img
              src={"/assets/icons/like.svg"}
              alt="like"
              width={20}
              height={20}
            />
            Liked Posts
          </Link>
          <Link
            to={`/profile/${id}/saved-posts`}
            className={`profile-tab rounded-r-lg ${
              pathname === `/profile/${id}/saved-posts` && "!bg-dark-3"
            }`}>
            <img
              src={"/assets/icons/save.svg"}
              alt="saved"
              width={20}
              height={20}
            />
            Saved Posts
          </Link>
        </div>
      )}

      <Routes>
        <Route
          index
          element={<ProfilePosts posts={userPosts?.documents || []} />}
        />
        {currentUser.id === user.id && (
          <>
            <Route path="/liked-posts" element={<LikedPosts />} />
            <Route path="/saved-posts" element={<Saved />} />
          </>
        )}
      </Routes>
      <Outlet />
    </div>
  );
};

export default Profile;