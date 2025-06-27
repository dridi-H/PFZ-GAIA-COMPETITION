import { supabase } from "./config";
import { RealtimeChannel } from "@supabase/supabase-js";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserPresence = {
  id: string;
  user_id: string;
  is_online: boolean;
  last_seen: string;
  updated_at: string;
  created_at: string;
};

// Track active channels to prevent duplicates
const activeChannels = new Map<string, RealtimeChannel>();

// Helper function to safely remove channel
function removeChannel(channelKey: string) {
  const existingChannel = activeChannels.get(channelKey);
  if (existingChannel) {
    try {
      supabase.removeChannel(existingChannel);
    } catch (error) {
      console.warn('Error removing channel:', error);
    }
    activeChannels.delete(channelKey);
  }
}

// Message Operations
export async function sendMessage({
  content,
  receiverId,
  senderId
}: {
  content: string;
  receiverId: string;
  senderId: string;
}) {
  try {
    // First, get or create conversation
    const { data: conversationData, error: conversationError } = await supabase
      .rpc('get_or_create_conversation', {
        user1_uuid: senderId,
        user2_uuid: receiverId
      });

    if (conversationError) {
      throw new Error(`Failed to get/create conversation: ${conversationError.message}`);
    }

    const conversationId = conversationData;

    // Insert the message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false
      }])
      .select(`
        *,
        sender:users!sender_id(id, name, username, image_url)
      `)
      .single();

    if (messageError) {
      throw new Error(`Failed to send message: ${messageError.message}`);
    }

    console.log('✅ Message sent successfully:', messageData);
    return messageData;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}

// Get conversation messages with pagination
export async function getConversationMessages({
  conversationId,
  limit = 50,
  offset = 0
}: {
  conversationId: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, name, username, image_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Reverse to show oldest first
    return data.reverse();
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    throw error;
  }
}

// ENHANCED get user conversations with REAL-TIME unread count
export async function getUserConversations(userId: string) {
  try {
    console.log('🔍 ENHANCED: getUserConversations called with userId:', userId);
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:users!user1_id(id, name, username, image_url),
        user2:users!user2_id(id, name, username, image_url)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    // Get REAL-TIME unread counts for each conversation
    const conversationsWithUnreadCounts = await Promise.all(
      data.map(async (conversation) => {
        try {
          // Get EXACT unread count right now
          const { data: unreadMessages, error: countError } = await supabase
            .from('messages')
            .select('id, content, created_at')
            .eq('conversation_id', conversation.id)
            .eq('receiver_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

          if (countError) {
            console.error(`❌ Error getting unread messages for conversation ${conversation.id}:`, countError);
          }

          const unreadCount = unreadMessages?.length || 0;
          console.log(`📊 Conversation ${conversation.id}: ${unreadCount} unread messages`);

          const otherUser = conversation.user1_id === userId 
            ? conversation.user2 
            : conversation.user1;

          return {
            ...conversation,
            otherUser,
            unreadCount
          };
        } catch (error) {
          console.error(`❌ Error processing conversation ${conversation.id}:`, error);
          return {
            ...conversation,
            otherUser: conversation.user1_id === userId ? conversation.user2 : conversation.user1,
            unreadCount: 0
          };
        }
      })
    );

    console.log('🔍 ENHANCED: Final conversations with real-time unread counts:', conversationsWithUnreadCounts);
    return conversationsWithUnreadCounts;
  } catch (error) {
    console.error('❌ Error in getUserConversations:', error);
    throw error;
  }
}

// AGGRESSIVE mark messages as read function
export async function markMessagesAsRead({
  conversationId,
  userId
}: {
  conversationId: string;
  userId: string;
}) {
  try {
    console.log(`📧 AGGRESSIVE: Marking ALL messages as read for conversation: ${conversationId}, user: ${userId}`);
    
    // First, let's see what unread messages exist
    const { data: unreadMessages, error: checkError } = await supabase
      .from('messages')
      .select('id, content, sender_id, is_read')
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (checkError) {
      console.error('❌ Error checking unread messages:', checkError);
    } else {
      console.log(`🔍 Found ${unreadMessages?.length || 0} unread messages`);
    }

    // Mark ALL messages in this conversation as read for this user
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .select('id, content');

    if (error) {
      console.error('❌ Error marking messages as read:', error);
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }

    console.log(`✅ AGGRESSIVE: Marked ${data?.length || 0} messages as read`);

    // Double-check: Verify no unread messages remain
    const { count: remainingUnread, error: verifyError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (verifyError) {
      console.error('❌ Error verifying unread count:', verifyError);
    } else {
      console.log(`🔍 VERIFICATION: ${remainingUnread || 0} unread messages remaining`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error in markMessagesAsRead:', error);
    throw error;
  }
}

// Force refresh function that waits for database to update
export async function forceMarkAsReadAndRefresh({
  conversationId,
  userId,
  onRefresh
}: {
  conversationId: string;
  userId: string;
  onRefresh: () => void;
}) {
  try {
    console.log(`🚀 FORCE REFRESH: Starting for conversation ${conversationId}`);
    
    // Step 1: Mark messages as read
    await markMessagesAsRead({ conversationId, userId });
    
    // Step 2: Wait a bit longer for database to sync
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 3: Force refresh
    onRefresh();
    
    // Step 4: Double refresh after another delay
    setTimeout(() => {
      console.log(`🔄 DOUBLE REFRESH: Refreshing again for ${conversationId}`);
      onRefresh();
    }, 500);
    
    return true;
  } catch (error) {
    console.error('❌ Error in forceMarkAsReadAndRefresh:', error);
    return false;
  }
}

// Get or create conversation between two users
export async function getOrCreateConversation({
  user1Id,
  user2Id
}: {
  user1Id: string;
  user2Id: string;
}) {
  try {
    const { data: conversationId, error } = await supabase
      .rpc('get_or_create_conversation', {
        user1_uuid: user1Id,
        user2_uuid: user2Id
      });

    if (error) {
      throw new Error(`Failed to get/create conversation: ${error.message}`);
    }

    // Fetch the full conversation details
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:users!user1_id(id, name, username, image_url),
        user2:users!user2_id(id, name, username, image_url)
      `)
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch conversation details: ${fetchError.message}`);
    }

    return conversation;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    throw error;
  }
}

// Search for users to start conversations with
export async function searchUsersForMessaging({
  query,
  currentUserId,
  limit = 10
}: {
  query: string;
  currentUserId: string;
  limit?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, username, image_url')
      .neq('id', currentUserId)
      .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in searchUsersForMessaging:', error);
    throw error;
  }
}

// ENHANCED Real-time subscription helpers
export function subscribeToConversationMessages(
  conversationId: string,
  callback: (message: any) => void
) {
  const channelKey = `conversation-messages-${conversationId}`;
  
  // Remove existing channel if it exists
  removeChannel(channelKey);
  
  console.log(`🔗 ENHANCED: Setting up message subscription for conversation: ${conversationId}`);
  
  const channel = supabase
    .channel(channelKey)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        try {
          console.log('📨 NEW MESSAGE EVENT:', payload);
          
          // Fetch the complete message with sender details
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id(id, name, username, image_url)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data && !error) {
            console.log('📨 ENHANCED: Broadcasting new message:', data);
            callback(data);
          }
        } catch (error) {
          console.error('Error fetching new message details:', error);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('📧 MESSAGE UPDATE EVENT (read status):', payload);
        // Trigger callback for read receipts
        if (payload.new) {
          callback(payload.new);
        }
      }
    )
    .subscribe((status) => {
      console.log(`📡 Message subscription status for ${conversationId}:`, status);
    });

  // Store the channel
  activeChannels.set(channelKey, channel);

  return {
    unsubscribe: () => {
      console.log(`🧹 Unsubscribing from message channel: ${conversationId}`);
      removeChannel(channelKey);
    }
  };
}

export function subscribeToUserConversations(
  userId: string,
  callback: (conversation: any) => void
) {
  const channelKey = `user-conversations-${userId}`;
  
  // Remove existing channel if it exists
  removeChannel(channelKey);
  
  console.log(`🔗 ENHANCED: Setting up conversation subscription for user: ${userId}`);
  
  const channel = supabase
    .channel(channelKey)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
      },
      (payload) => {
        console.log('📨 CONVERSATION EVENT:', payload);
        callback(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        console.log('📨 ANY MESSAGE EVENT (for conversation updates):', payload);
        // Trigger callback for any message changes
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`📡 Conversation subscription status for ${userId}:`, status);
    });

  // Store the channel
  activeChannels.set(channelKey, channel);

  return {
    unsubscribe: () => {
      console.log(`🧹 Unsubscribing from conversation channel: ${userId}`);
      removeChannel(channelKey);
    }
  };
}

// Typing indicators using Supabase presence
export function sendTypingIndicator(conversationId: string, userId: string, userName: string) {
  const channelKey = `conversation-typing-${conversationId}`;
  
  // Get or create typing channel
  let typingChannel = activeChannels.get(channelKey);
  
  if (!typingChannel) {
    typingChannel = supabase.channel(channelKey);
    activeChannels.set(channelKey, typingChannel);
    typingChannel.subscribe();
  }
  
  return typingChannel.track({
    user_id: userId,
    user_name: userName,
    typing: true,
    online_at: new Date().toISOString()
  });
}

export function subscribeToTypingIndicators(
  conversationId: string,
  callback: (typingUsers: any[]) => void
) {
  const channelKey = `conversation-typing-${conversationId}`;
  
  // Remove existing channel if it exists
  removeChannel(channelKey);
  
  console.log(`🔗 Setting up typing subscription for conversation: ${conversationId}`);
  
  const channel = supabase
    .channel(channelKey)
    .on('presence', { event: 'sync' }, () => {
      try {
        const state = channel.presenceState();
        const typingUsers = Object.values(state)
          .flat()
          .filter((user: any) => user.typing);
        callback(typingUsers);
      } catch (error) {
        console.error('Error processing typing indicators:', error);
      }
    })
    .subscribe();

  // Store the channel
  activeChannels.set(channelKey, channel);

  return {
    unsubscribe: () => {
      console.log(`🧹 Unsubscribing from typing channel: ${conversationId}`);
      removeChannel(channelKey);
    }
  };
}

// ===== PRESENCE FUNCTIONS =====

// Update user's online presence
export async function updateUserPresence(userId: string, isOnline: boolean) {
  try {
    console.log(`🟢 Updating presence for ${userId}: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    
    const { data, error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('❌ Error updating presence:', error);
      return false;
    }
    
    console.log(`✅ Presence updated successfully for ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Exception updating presence:', error);
    return false;
  }
}

// Get user's presence status
export async function getUserPresence(userId: string) {
  try {
    console.log(`🔍 Fetching presence for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching presence:', error);
      return null;
    }

    console.log(`📊 Presence data for ${userId}:`, data);
    return data;
  } catch (error) {
    console.error('❌ Exception fetching presence:', error);
    return null;
  }
}

// Subscribe to user presence changes
export function subscribeToUserPresence(userId: string, callback: (presence: any) => void) {
  const channelKey = `presence-${userId}`;
  
  // Remove existing channel if it exists
  removeChannel(channelKey);
  
  console.log(`🔗 Setting up presence subscription for user: ${userId}`);
  
  try {
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🟢 Presence update received:', payload);
          if (payload.new) {
            callback(payload.new);
          } else if (payload.old && payload.eventType === 'DELETE') {
            callback({ ...payload.old, is_online: false });
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Presence subscription status for ${userId}:`, status);
      });

    // Store the channel
    activeChannels.set(channelKey, channel);

    return {
      unsubscribe: () => {
        console.log(`🧹 Unsubscribing from presence channel: ${userId}`);
        removeChannel(channelKey);
      }
    };
  } catch (error) {
    console.error('❌ Error subscribing to presence:', error);
    return null;
  }
}

// Auto-cleanup offline users
export async function cleanupOfflineUsers() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    console.log('🧹 Cleaning up offline users...');
    
    const { data, error } = await supabase
      .from('user_presence')
      .update({ is_online: false })
      .lt('updated_at', fiveMinutesAgo)
      .eq('is_online', true)
      .select();

    if (error) {
      console.error('❌ Error cleaning up offline users:', error);
    } else {
      console.log(`✅ Cleaned up ${data?.length || 0} offline users`);
    }
  } catch (error) {
    console.error('❌ Exception cleaning up offline users:', error);
  }
}

// Cleanup function to remove all active channels
export function cleanupAllChannels() {
  console.log('🧹 Cleaning up all messaging channels');
  activeChannels.forEach((channel, key) => {
    removeChannel(key);
  });
}