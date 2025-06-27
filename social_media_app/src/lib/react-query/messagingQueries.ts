import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  sendMessage, 
  getConversationMessages, 
  getUserConversations, 
  markMessagesAsRead,
  getOrCreateConversation,
  searchUsersForMessaging
} from "@/lib/supabase/messaging";

export const QUERY_KEYS = {
  CONVERSATIONS: "conversations",
  CONVERSATION_MESSAGES: "conversationMessages",
  USERS_SEARCH: "usersSearch"
};

// Get user conversations - FIXED: Added better caching
export const useGetUserConversations = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATIONS, userId],
    queryFn: () => getUserConversations(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes - reduced from 5 minutes
    refetchInterval: false, // Don't auto-refetch to prevent loops
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

// Get conversation messages - FIXED: Better caching
export const useGetConversationMessages = (conversationId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATION_MESSAGES, conversationId],
    queryFn: () => getConversationMessages({ conversationId }),
    enabled: !!conversationId,
    staleTime: 1000 * 60, // 1 minute - reduced from 30 seconds
    refetchInterval: false, // Don't auto-refetch
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

// Send message mutation - FIXED: Better cache management
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (data, variables) => {
      // Update conversation messages
      queryClient.setQueryData(
        [QUERY_KEYS.CONVERSATION_MESSAGES, data.conversation_id],
        (old: any) => {
          if (!old) return [data];
          return [...old, data];
        }
      );

      // Only invalidate conversations for both users, don't refetch immediately
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, variables.senderId],
        refetchType: 'none' // Don't refetch immediately
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, variables.receiverId],
        refetchType: 'none' // Don't refetch immediately
      });
    },
  });
};

// Mark messages as read mutation - FIXED: No infinite loops
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markMessagesAsRead,
    onSuccess: (_, variables) => {
      console.log('✅ Messages marked as read:', variables);
      
      // Update conversation messages to mark as read
      queryClient.setQueryData(
        [QUERY_KEYS.CONVERSATION_MESSAGES, variables.conversationId],
        (old: any) => {
          if (!old) return old;
          return old.map((msg: any) => {
            // Mark messages as read if they were sent TO the current user (not FROM them)
            if (msg.sender_id !== variables.userId && !msg.is_read) {
              console.log('📧 Marking message as read:', msg.id);
              return { ...msg, is_read: true };
            }
            return msg;
          });
        }
      );

      // IMPORTANT: Update conversations list to clear unread count
      queryClient.setQueryData(
        [QUERY_KEYS.CONVERSATIONS, variables.userId],
        (old: any) => {
          if (!old) return old;
          return old.map((conversation: any) => {
            if (conversation.id === variables.conversationId) {
              console.log('🔔 Clearing unread count for conversation:', conversation.id);
              return { ...conversation, unreadCount: 0 };
            }
            return conversation;
          });
        }
      );

      // Invalidate but don't refetch immediately to prevent loops
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, variables.userId],
        refetchType: 'none'
      });
    },
  });
};

// Get or create conversation mutation - FIXED: Better invalidation
export const useGetOrCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getOrCreateConversation,
    onSuccess: (_, variables) => {
      // Only invalidate, don't force immediate refetch
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, variables.user1Id],
        refetchType: 'none'
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONVERSATIONS, variables.user2Id],
        refetchType: 'none'
      });
    },
  });
};

// Search users for messaging - FIXED: Better debouncing
export const useSearchUsersForMessaging = (query: string, currentUserId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS_SEARCH, query, currentUserId],
    queryFn: () => searchUsersForMessaging({ query, currentUserId }),
    enabled: query.length > 2 && !!currentUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};