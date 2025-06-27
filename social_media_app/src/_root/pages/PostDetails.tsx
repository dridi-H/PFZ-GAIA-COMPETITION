import { useParams, Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui";
import { Loader, PostStats, CommentsSection } from "@/components/shared";

import {
  useGetPostById,
  useDeletePost,
} from "@/lib/react-query/queries";
import { useGetCommentCount } from "@/lib/react-query/commentQueries";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";

const PostDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUserContext();

  const { data: post, isLoading } = useGetPostById(id);
  const { data: commentCount, isLoading: commentCountLoading } = useGetCommentCount(id || "");
  const { mutate: deletePost } = useDeletePost();

  const handleDeletePost = () => {
    deletePost({ postId: id, imageId: post?.image_id });
    navigate(-1);
  };

  const handleCommentClick = () => {
    // Scroll to comments section
    const commentsSection = document.querySelector('.post-details-comments');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="post_details-container">
      <div className="hidden md:flex max-w-5xl w-full">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="shad-button_ghost"
        >
          <img
            src="/assets/icons/back.svg"
            alt="back"
            width={24}
            height={24}
          />
          <p className="small-medium lg:base-medium">Back</p>
        </Button>
      </div>

      {isLoading || !post ? (
        <Loader />
      ) : (        <div className="post_details-card">
          {/* Only show image if it exists */}
          {post?.image_url && (
            <img
              src={post?.image_url}
              alt="post image"
              className="post_details-img"
              onError={(e) => {
                console.error('Post image failed to load:', post?.image_url);
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link
                to={`/profile/${post?.creator?.id}`}
                className="flex items-center gap-3"
              >
                <img
                  src={
                    post?.creator?.image_url ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="w-8 h-8 lg:w-12 lg:h-12 rounded-full"
                />                <div className="flex gap-1 flex-col">
                  <p className="base-medium lg:body-bold text-light-1">
                    {post?.creator?.name}
                  </p>
                  <div className="flex-center gap-2 text-light-3">
                    <p className="subtle-semibold lg:small-regular ">
                      {multiFormatDateString(post?.created_at)}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex-center gap-4">
                <Link
                  to={`/update-post/${post?.id}`}
                  className={`${user.id !== post?.creator?.id && "hidden"}`}
                >
                  <img
                    src="/assets/icons/edit.svg"
                    alt="edit"
                    width={24}
                    height={24}
                  />
                </Link>

                <Button
                  onClick={handleDeletePost}
                  variant="ghost"
                  className={`ost_details-delete_btn ${
                    user.id !== post?.creator?.id && "hidden"
                  }`}
                >
                  <img
                    src="/assets/icons/delete.svg"
                    alt="delete"
                    width={24}
                    height={24}
                  />
                </Button>
              </div>
            </div>

            <hr className="border w-full border-dark-4/80" />            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p>{post?.caption}</p>
              {post?.tags && post?.tags.length > 0 && (
                <ul className="flex gap-1 mt-2">
                  {post?.tags.map((tag: string, index: number) => (
                    <li
                      key={`${tag}${index}`}
                      className="text-light-3 small-regular"
                    >
                      #{tag}
                    </li>
                  ))}
                </ul>
              )}
            </div><div className="w-full">
              <PostStats 
                post={post} 
                userId={user.id} 
                showComments={true}
                onCommentClick={handleCommentClick}
              />
            </div>

            {/* Comments Section */}
            <hr className="border w-full border-dark-4/80 mt-6" />
            
            <div className="w-full mt-6">
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/assets/icons/chat.svg" 
                  alt="comments" 
                  width={24} 
                  height={24}
                  className="opacity-70"
                />
                <h3 className="body-bold text-light-1">
                  {commentCountLoading ? (
                    <span className="opacity-50">Loading comments...</span>
                  ) : (
                    <>
                      {commentCount === 0 ? "No comments yet" : 
                       commentCount === 1 ? "1 Comment" : 
                       `${commentCount} Comments`}
                    </>
                  )}
                </h3>
              </div>
              
              <CommentsSection 
                postId={post.id} 
                className="post-details-comments"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;