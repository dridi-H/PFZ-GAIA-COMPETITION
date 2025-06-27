import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";

import { Input } from "@/components/ui";
import { Loader } from "@/components/shared";
import useDebounce from "@/hooks/useDebounce";
import { useGetPosts, useSearchPosts } from "@/lib/react-query/queries";

export type SearchResultProps = {
  isSearchFetching: boolean;
  searchedPosts: any;
};

// Simple posts grid component for explore page
const ExplorePostsGrid = ({ posts }: { posts: any[] }) => {
  if (!posts || posts.length === 0) {
    return (
      <p className="text-light-4 mt-10 text-center w-full">No posts found</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl">
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
              alt="post"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = "/assets/icons/profile-placeholder.svg";
              }}
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-2 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <img src="/assets/icons/like.svg" alt="likes" className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                  </div>
                </div>
                {creatorData && (
                  <p className="text-xs text-center">@{creatorData.username || creatorData.name}</p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

const SearchResults = ({ isSearchFetching, searchedPosts }: SearchResultProps) => {
  if (isSearchFetching) {
    return <Loader />;
  } else if (searchedPosts && searchedPosts.documents.length > 0) {
    return <ExplorePostsGrid posts={searchedPosts.documents} />;
  } else {
    return (
      <p className="text-light-4 mt-10 text-center w-full">No results found</p>
    );
  }
};

const Explore = () => {
  const { ref, inView } = useInView();
  const { data: posts, fetchNextPage, hasNextPage } = useGetPosts();

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const { data: searchedPosts, isFetching: isSearchFetching } = useSearchPosts(debouncedSearch);

  useEffect(() => {
    if (inView && !searchValue) {
      fetchNextPage();
    }
  }, [inView, searchValue, fetchNextPage]);

  if (!posts)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  const shouldShowSearchResults = searchValue !== "";

  // Fixed logic: Check if there are NO posts to show "End of posts"
  const hasNoPosts = posts.pages.every((item) => item.documents.length === 0);

  // Debug logging to see what's happening
  console.log('🔍 Explore Debug:', {
    searchValue,
    shouldShowSearchResults,
    hasNoPosts,
    pagesCount: posts.pages.length,
    firstPagePosts: posts.pages[0]?.documents?.length || 0,
    totalPosts: posts.pages.reduce((total, page) => total + page.documents.length, 0)
  });

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search Posts</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            width={24}
            height={24}
            alt="search"
          />
          <Input
            type="text"
            placeholder="Search"
            className="explore-search"
            value={searchValue}
            onChange={(e) => {
              const { value } = e.target;
              setSearchValue(value);
            }}
          />
        </div>
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">Popular Today</h3>

        <div className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2 cursor-pointer">
          <p className="small-medium md:base-medium text-light-2">All</p>
          <img
            src="/assets/icons/filter.svg"
            width={20}
            height={20}
            alt="filter"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-9 w-full max-w-5xl justify-center">
        {shouldShowSearchResults ? (
          <SearchResults
            isSearchFetching={isSearchFetching}
            searchedPosts={searchedPosts}
          />
        ) : hasNoPosts ? (
          <div className="flex flex-col items-center justify-center h-64 w-full">
            <img 
              src="/assets/icons/posts.svg" 
              alt="No posts"
              className="w-16 h-16 mb-4 opacity-50"
            />
            <p className="text-light-4 text-center">End of posts</p>
          </div>
        ) : (
          <div className="w-full">
            {posts.pages.map((item, index) => (
              <div key={`page-${index}`} className="mb-8">
                <ExplorePostsGrid posts={item.documents} />
              </div>
            ))}
          </div>
        )}
      </div>

      {hasNextPage && !searchValue && (
        <div ref={ref} className="mt-10">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default Explore;