import { supabase } from "./config";

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type UserWithStats = {
  id: string;
  name: string;
  username: string;
  email: string;
  image_url?: string;
  bio?: string;
  created_at: string;
  followers_count: number;
  following_count: number;
};

// Follow a user
export async function followUser({
  followerId,
  followingId
}: {
  followerId: string;
  followingId: string;
}) {
  try {
    if (followerId === followingId) {
      throw new Error("You cannot follow yourself");
    }

    const { data, error } = await supabase
      .from('follows')
      .insert([{
        follower_id: followerId,
        following_id: followingId
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error("You are already following this user");
      }
      throw new Error(`Failed to follow user: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in followUser:', error);
    throw error;
  }
}

// Unfollow a user
export async function unfollowUser({
  followerId,
  followingId
}: {
  followerId: string;
  followingId: string;
}) {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({
        follower_id: followerId,
        following_id: followingId
      });

    if (error) {
      throw new Error(`Failed to unfollow user: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    throw error;
  }
}

// Check if current user is following another user
export async function checkIsFollowing({
  followerId,
  followingId
}: {
  followerId: string;
  followingId: string;
}) {
  try {
    const { data, error } = await supabase
      .rpc('is_following', {
        follower_uuid: followerId,
        following_uuid: followingId
      });

    if (error) {
      throw new Error(`Failed to check follow status: ${error.message}`);
    }

    return data as boolean;
  } catch (error) {
    console.error('Error in checkIsFollowing:', error);
    throw error;
  }
}

// Get user with follower/following counts
export async function getUserWithStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }

    return data as UserWithStats;
  } catch (error) {
    console.error('Error in getUserWithStats:', error);
    throw error;
  }
}

// Get followers of a user
export async function getUserFollowers({
  userId,
  limit = 50,
  offset = 0
}: {
  userId: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        follower:users!follower_id(
          id,
          name,
          username,
          image_url,
          bio
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get followers: ${error.message}`);
    }

    return data.map(item => ({
      ...item.follower,
      followed_at: item.created_at
    }));
  } catch (error) {
    console.error('Error in getUserFollowers:', error);
    throw error;
  }
}

// Get users that a user is following
export async function getUserFollowing({
  userId,
  limit = 50,
  offset = 0
}: {
  userId: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        following:users!following_id(
          id,
          name,
          username,
          image_url,
          bio
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get following: ${error.message}`);
    }

    return data.map(item => ({
      ...item.following,
      followed_at: item.created_at
    }));
  } catch (error) {
    console.error('Error in getUserFollowing:', error);
    throw error;
  }
}

// Get follow counts for a user
export async function getFollowCounts(userId: string) {
  try {
    const [followersResult, followingResult] = await Promise.all([
      supabase.rpc('get_follower_count', { user_uuid: userId }),
      supabase.rpc('get_following_count', { user_uuid: userId })
    ]);

    if (followersResult.error) {
      throw new Error(`Failed to get followers count: ${followersResult.error.message}`);
    }

    if (followingResult.error) {
      throw new Error(`Failed to get following count: ${followingResult.error.message}`);
    }

    return {
      followers: followersResult.data as number,
      following: followingResult.data as number
    };
  } catch (error) {
    console.error('Error in getFollowCounts:', error);
    throw error;
  }
}

// Real-time subscription for follow changes
export function subscribeToUserFollows(
  userId: string,
  callback: (payload: any) => void
) {
  const subscription = supabase
    .channel(`user-follows-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `or(follower_id.eq.${userId},following_id.eq.${userId})`
      },
      callback
    )
    .subscribe();

  return subscription;
}
