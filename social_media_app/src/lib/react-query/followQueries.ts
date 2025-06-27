import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  followUser, 
  unfollowUser, 
  checkIsFollowing,
  getUserWithStats,
  getUserFollowers,
  getUserFollowing,
  getFollowCounts
} from "@/lib/supabase/follows";

export const FOLLOW_QUERY_KEYS = {
  FOLLOWS: "follows",
  IS_FOLLOWING: "isFollowing",
  USER_STATS: "userStats",
  FOLLOWERS: "followers",
  FOLLOWING: "following",
  FOLLOW_COUNTS: "followCounts"
};

// Check if current user is following another user
export const useIsFollowing = (followerId: string, followingId: string) => {
  return useQuery({
    queryKey: [FOLLOW_QUERY_KEYS.IS_FOLLOWING, followerId, followingId],
    queryFn: () => checkIsFollowing({ followerId, followingId }),
    enabled: !!followerId && !!followingId && followerId !== followingId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get user with follower/following stats
export const useUserWithStats = (userId: string) => {
  return useQuery({
    queryKey: [FOLLOW_QUERY_KEYS.USER_STATS, userId],
    queryFn: () => getUserWithStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get follow counts for a user
export const useFollowCounts = (userId: string) => {
  return useQuery({
    queryKey: [FOLLOW_QUERY_KEYS.FOLLOW_COUNTS, userId],
    queryFn: () => getFollowCounts(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get user followers
export const useUserFollowers = (userId: string) => {
  return useQuery({
    queryKey: [FOLLOW_QUERY_KEYS.FOLLOWERS, userId],
    queryFn: () => getUserFollowers({ userId }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get users that a user is following
export const useUserFollowing = (userId: string) => {
  return useQuery({
    queryKey: [FOLLOW_QUERY_KEYS.FOLLOWING, userId],
    queryFn: () => getUserFollowing({ userId }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Follow user mutation
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followUser,
    onSuccess: (_, variables) => {
      const { followerId, followingId } = variables;

      // Update the isFollowing status
      queryClient.setQueryData(
        [FOLLOW_QUERY_KEYS.IS_FOLLOWING, followerId, followingId],
        true
      );

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.USER_STATS, followingId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.USER_STATS, followerId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.FOLLOW_COUNTS, followingId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.FOLLOW_COUNTS, followerId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.FOLLOWERS, followingId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.FOLLOWING, followerId]
      });
    },    onError: (_, variables) => {
      const { followerId, followingId } = variables;
      
      // Revert optimistic update on error
      queryClient.setQueryData(
        [FOLLOW_QUERY_KEYS.IS_FOLLOWING, followerId, followingId],
        false
      );
    },
  });
};

// Unfollow user mutation
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unfollowUser,
    onSuccess: (_, variables) => {
      const { followerId, followingId } = variables;

      // Update the isFollowing status
      queryClient.setQueryData(
        [FOLLOW_QUERY_KEYS.IS_FOLLOWING, followerId, followingId],
        false
      );

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.USER_STATS, followingId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.USER_STATS, followerId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.FOLLOW_COUNTS, followingId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.FOLLOW_COUNTS, followerId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.FOLLOWERS, followingId]
      });
      queryClient.invalidateQueries({
        queryKey: [FOLLOW_QUERY_KEYS.FOLLOWING, followerId]
      });
    },    onError: (_, variables) => {
      const { followerId, followingId } = variables;
      
      // Revert optimistic update on error
      queryClient.setQueryData(
        [FOLLOW_QUERY_KEYS.IS_FOLLOWING, followerId, followingId],
        true
      );
    },
  });
};
