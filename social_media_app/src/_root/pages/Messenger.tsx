import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { useUserContext } from "@/context/AuthContext";
import { Loader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useDebounce from "@/hooks/useDebounce";
import {
  useGetUserConversations,
  useGetConversationMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  useGetOrCreateConversation,
  useSearchUsersForMessaging
} from "@/lib/react-query/messagingQueries";
import {
  subscribeToConversationMessages,
  subscribeToUserConversations,
  subscribeToTypingIndicators,
  sendTypingIndicator,
  updateUserPresence,
  subscribeToUserPresence,
  getUserPresence,
  forceMarkAsReadAndRefresh
} from "@/lib/supabase/messaging";
import { getUserById } from "@/lib/supabase/api";

// Same emoji array as your post creator
const popularEmojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
  "✨", "🌟", "💫", "⭐", "🌠", "☄️", "💥", "🔥", "🌈", "☀️",
  "👍", "👎", "👏", "🙌", "👐", "🤝", "👊", "✊", "🤞", "✌️",
  "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️"
];

type ConversationUser = {
  id: string;
  name: string;
  username: string;
  image_url?: string;
  is_online?: boolean;
  last_seen?: string;
};

type ConversationItem = {
  id: string;
  otherUser: ConversationUser;
  last_message: string | null;
  last_message_at: string | null;
  unreadCount: number;
};

type MessageItem = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  sender: ConversationUser;
};

type UserPresence = {
  user_id: string;
  is_online: boolean;
  last_seen: string;
};

const Messenger = memo(() => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Basic state
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [autoContactProcessed, setAutoContactProcessed] = useState(false);
  const [userPresences, setUserPresences] = useState<Record<string, UserPresence>>({});
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // React Query hooks
  const { 
    data: conversations, 
    isLoading: conversationsLoading,
    refetch: refetchConversations 
  } = useGetUserConversations(user?.id || "");
  
  const { 
    data: messages, 
    isLoading: messagesLoading,
    refetch: refetchMessages 
  } = useGetConversationMessages(selectedConversation || "");

  const { data: searchResults, isLoading: searchLoading } = useSearchUsersForMessaging(
    debouncedSearchQuery, 
    user?.id || ""
  );

  // Mutations
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkMessagesAsRead();
  const createConversationMutation = useGetOrCreateConversation();

  // Get selected conversation data
  const selectedConversationData = conversations?.find(c => c.id === selectedConversation);

  // Format time utility
  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Format last seen utility
  const formatLastSeen = useCallback((lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Active now';
    } else if (minutes < 60) {
      return `Active ${minutes}m ago`;
    } else if (hours < 24) {
      return `Active ${hours}h ago`;
    } else if (days === 1) {
      return 'Active yesterday';
    } else if (days < 7) {
      return `Active ${days}d ago`;
    } else {
      return 'Active long ago';
    }
  }, []);

  // Online indicator component
  const OnlineIndicator = ({ userId, size = "small" }: { userId: string, size?: "small" | "large" }) => {
    const presence = userPresences[userId];
    const isOnline = presence?.is_online;
    
    const dotSize = size === "large" ? "w-3 h-3" : "w-2.5 h-2.5";
    const borderSize = size === "large" ? "border-2" : "border-[1.5px]";
    
    return (
      <div className={`${dotSize} ${borderSize} border-dark-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-gray-500'
      }`} />
    );
  };

  // Get online status
  const getOnlineStatus = useCallback((userId: string) => {
    const presence = userPresences[userId];
    if (!presence) return { isOnline: false, statusText: 'Offline' };
    
    if (presence.is_online) {
      return { isOnline: true, statusText: 'Active now' };
    } else {
      return { 
        isOnline: false, 
        statusText: formatLastSeen(presence.last_seen) 
      };
    }
  }, [userPresences, formatLastSeen]);

  // Set user as online when component mounts
  useEffect(() => {
    if (!user?.id) return;

    updateUserPresence(user.id, true);

    const presenceInterval = setInterval(() => {
      updateUserPresence(user.id, true);
    }, 30000);

    const handleBeforeUnload = () => {
      updateUserPresence(user.id, false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateUserPresence(user.id, false);
    };
  }, [user?.id]);

  // Subscribe to presence updates for conversation users
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    const userIds = conversations.map(conv => conv.otherUser.id);
    const presenceSubscriptions: any[] = [];

    userIds.forEach(userId => {
      const sub = subscribeToUserPresence(userId, (presence: UserPresence) => {
        setUserPresences(prev => ({
          ...prev,
          [userId]: presence
        }));
      });
      if (sub) presenceSubscriptions.push(sub);
    });

    userIds.forEach(async (userId) => {
      try {
        const presence = await getUserPresence(userId);
        if (presence) {
          setUserPresences(prev => ({
            ...prev,
            [userId]: presence
          }));
        }
      } catch (error) {
        console.error('Failed to fetch presence for user:', userId, error);
      }
    });

    return () => {
      presenceSubscriptions.forEach(sub => {
        if (sub?.unsubscribe) {
          sub.unsubscribe();
        }
      });
    };
  }, [conversations]);

  // Subscribe to selected conversation user's presence
  useEffect(() => {
    if (!selectedConversationData?.otherUser.id) return;

    const userId = selectedConversationData.otherUser.id;
    const sub = subscribeToUserPresence(userId, (presence: UserPresence) => {
      setUserPresences(prev => ({
        ...prev,
        [userId]: presence
      }));
    });

    return () => {
      if (sub?.unsubscribe) {
        sub.unsubscribe();
      }
    };
  }, [selectedConversationData?.otherUser.id]);

  // Handle marketplace auto-contact
  useEffect(() => {
    const handleAutoContact = async () => {
      if (!user?.id || autoContactProcessed) return;

      const sellerId = searchParams.get('to');
      const message = searchParams.get('message');
      const itemId = searchParams.get('item');

      if (sellerId && message) {
        try {
          const seller = await getUserById(sellerId);
          if (!seller) {
            toast({
              title: "Error",
              description: "Could not find the seller.",
              variant: "destructive"
            });
            return;
          }

          const conversation = await createConversationMutation.mutateAsync({
            user1Id: user.id,
            user2Id: sellerId
          });

          setSelectedConversation(conversation.id);

          const decodedMessage = decodeURIComponent(message);
          const finalMessage = `${decodedMessage}. Is this item still available?`;
          setNewMessage(finalMessage);

          setTimeout(() => {
            messageInputRef.current?.focus();
          }, 1000);

          refetchConversations();
    

          setAutoContactProcessed(true);

        } catch (error) {
          console.error('❌ Auto-contact error:', error);
          toast({
            title: "Error",
            description: "Failed to start conversation with seller.",
            variant: "destructive"
          });
        }
      }
    };

    if (!conversationsLoading && user?.id) {
      handleAutoContact();
    }
  }, [user?.id, searchParams, autoContactProcessed, conversationsLoading, createConversationMutation, refetchConversations, toast]);

  // Stable callbacks
  const stableRefetchConversations = useCallback(() => {
    console.log('🔄 Refetching conversations...');
    refetchConversations();
  }, [refetchConversations]);

  const stableRefetchMessages = useCallback(() => {
    console.log('🔄 Refetching messages...');
    refetchMessages();
  }, [refetchMessages]);

  // Enhanced message handler for real-time updates
  const stableHandleNewMessage = useCallback((newMessage: MessageItem) => {
    console.log('📨 NEW MESSAGE RECEIVED:', newMessage);
    
    // Immediately refresh messages to show the new message
    stableRefetchMessages();
    
    // Also refresh conversations to update last message and unread counts
    stableRefetchConversations();
    
    // Mark as read if user is viewing this conversation
    if (newMessage.sender_id !== user?.id && selectedConversation && user?.id) {
      console.log('📧 Auto-marking new message as read');
      markAsReadMutation.mutate({
        conversationId: selectedConversation,
        userId: user.id
      });
    }
  }, [selectedConversation, user?.id, markAsReadMutation, stableRefetchMessages, stableRefetchConversations]);

  // Auto-mark messages as read when viewing a conversation (AGGRESSIVE VERSION)
  useEffect(() => {
    if (!selectedConversation || !user?.id || !messages) return;

    const unreadMessages = messages.filter((msg: MessageItem) => 
      msg.sender_id !== user.id && !msg.is_read
    );

    if (unreadMessages.length > 0) {
      console.log(`📧 AUTO-AGGRESSIVE: Marking ${unreadMessages.length} messages as read`);
      
      // Use the aggressive function
      forceMarkAsReadAndRefresh({
        conversationId: selectedConversation,
        userId: user.id,
        onRefresh: () => {
          console.log(`🔄 AUTO-REFRESH: Force refreshing conversations...`);
          refetchConversations();
        }
      });
    }
  }, [selectedConversation, user?.id, messages, refetchConversations]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ENHANCED Real-time subscriptions for conversations
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Setting up ENHANCED conversation subscription for user:', user.id);
    
    let conversationSub: any = null;
    
    try {
      conversationSub = subscribeToUserConversations(user.id, (payload) => {
        console.log('📨 Conversation event received:', payload);
        // Refresh conversations whenever ANY conversation changes
        stableRefetchConversations();
      });
    } catch (error) {
      console.error('❌ Failed to setup conversation subscription:', error);
    }

    return () => {
      console.log('🧹 Cleaning up conversation subscription');
      if (conversationSub?.unsubscribe) {
        conversationSub.unsubscribe();
      }
    };
  }, [user?.id, stableRefetchConversations]);

  // ENHANCED Real-time subscriptions for messages
  useEffect(() => {
    if (!selectedConversation || !user?.id) return;

    console.log('🔗 Setting up ENHANCED message subscription for conversation:', selectedConversation);
    
    let messagesSub: any = null;
    let typingSub: any = null;

    try {
      // Enhanced message subscription
      messagesSub = subscribeToConversationMessages(selectedConversation, stableHandleNewMessage);
      
      // Typing indicators
      typingSub = subscribeToTypingIndicators(selectedConversation, setTypingUsers);
    } catch (error) {
      console.error('❌ Failed to setup message subscriptions:', error);
    }

    return () => {
      console.log('🧹 Cleaning up message and typing subscriptions');
      if (messagesSub?.unsubscribe) {
        messagesSub.unsubscribe();
      }
      if (typingSub?.unsubscribe) {
        typingSub.unsubscribe();
      }
    };
  }, [selectedConversation, user?.id, stableHandleNewMessage]);

  // ENHANCED Handle send message with immediate UI updates
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    const messageContent = newMessage.trim();
    const conversation = conversations?.find(c => c.id === selectedConversation);
    if (!conversation) return;

    console.log('🚀 SENDING MESSAGE:', messageContent);

    setNewMessage("");
    setShowEmojiPicker(false);

    try {
      await sendMessageMutation.mutateAsync({
        content: messageContent,
        receiverId: conversation.otherUser.id,
        senderId: user.id
      });
      
      console.log('✅ Message sent successfully');
      
      // Force refresh messages and conversations immediately
      setTimeout(() => {
        stableRefetchMessages();
        stableRefetchConversations();
      }, 100);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [newMessage, selectedConversation, user?.id, conversations, sendMessageMutation, toast, stableRefetchMessages, stableRefetchConversations]);

  // Handle start conversation
  const handleStartConversation = useCallback(async (targetUser: ConversationUser) => {
    if (!user?.id) return;
    
    try {
      const conversation = await createConversationMutation.mutateAsync({
        user1Id: user.id,
        user2Id: targetUser.id
      });
      
      setSelectedConversation(conversation.id);
      setShowUserSearch(false);
      setSearchQuery("");
      
      await refetchConversations();
      
    } catch (error) {
      toast({
        title: "Failed to start conversation",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [user?.id, createConversationMutation, toast, refetchConversations]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!selectedConversation || !user?.id || !user?.name) return;

    sendTypingIndicator(selectedConversation, user.id, user.name);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
    }, 3000);
  }, [selectedConversation, user?.id, user?.name]);

  // Handle emoji click
  const handleEmojiClick = (emoji: string) => {
    const input = messageInputRef.current;
    
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newText = newMessage.slice(0, start) + emoji + newMessage.slice(end);
      
      setNewMessage(newText);
      
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 10);
    } else {
      setNewMessage(newMessage + emoji);
    }
    
    setShowEmojiPicker(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== searchInputRef.current) {
        event.preventDefault();
        if (!showUserSearch) {
          setShowUserSearch(true);
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
      if (event.key === 'Escape' && showUserSearch) {
        setShowUserSearch(false);
        setSearchQuery("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserSearch]);

  // Early returns
  if (!user?.id) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <p className="text-light-3">Please sign in to access messages</p>
      </div>
    );
  }

  if (conversationsLoading) {
    return (
      <div className="flex flex-1 justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-dark-2 border-r border-dark-4 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3-bold text-light-1">Messages</h2>
            <Button
              onClick={() => setShowUserSearch(!showUserSearch)}
              className="w-10 h-10 bg-dark-3 hover:bg-dark-4 border border-dark-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <img src="/assets/icons/search.svg" alt="search users" className="w-5 h-5 invert" />
            </Button>
          </div>
          
          {showUserSearch && (
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search users... (Press '/' to focus)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="shad-input pr-8"
                  autoFocus
                  ref={searchInputRef}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-light-3 hover:text-light-1"
                  >
                    <img src="/assets/icons/delete.svg" alt="clear" className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {searchQuery.length > 0 && searchQuery.length <= 2 && (
                <div className="p-2 text-center text-light-3 text-xs">
                  Type at least 3 characters to search
                </div>
              )}
              
              {searchLoading && debouncedSearchQuery.length > 2 && (
                <div className="flex justify-center p-3">
                  <Loader />
                </div>
              )}
              
              {searchResults && searchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto bg-dark-3 rounded-lg">
                  {searchResults.map((searchUser) => (
                    <div
                      key={searchUser.id}
                      onClick={() => handleStartConversation(searchUser)}
                      className="flex items-center gap-3 p-3 hover:bg-dark-4 cursor-pointer"
                    >
                      <img
                        src={searchUser.image_url || "/assets/icons/profile-placeholder.svg"}
                        alt={searchUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="small-medium text-light-1">{searchUser.name}</p>
                        <p className="subtle-semibold text-light-3">@{searchUser.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {debouncedSearchQuery.length > 2 && !searchLoading && (!searchResults || searchResults.length === 0) && (
                <div className="p-3 text-center text-light-3 text-sm">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations && conversations.length > 0 ? (
            conversations.map((conversation: ConversationItem) => (
              <div
                key={conversation.id}
                onClick={async () => {
                  console.log(`🎯 CLICKING conversation ${conversation.id} with ${conversation.unreadCount} unread`);
                  
                  setSelectedConversation(conversation.id);
                  setShowUserSearch(false);
                  setShowEmojiPicker(false);
                  
                  // AGGRESSIVE: Mark as read immediately if there are unread messages
                  if (conversation.unreadCount > 0 && user?.id) {
                    console.log(`🚀 AGGRESSIVE MARK: Conversation has ${conversation.unreadCount} unread messages`);
                    
                    try {
                      await forceMarkAsReadAndRefresh({
                        conversationId: conversation.id,
                        userId: user.id,
                        onRefresh: () => {
                          console.log(`🔄 FORCE REFRESHING conversations...`);
                          refetchConversations();
                        }
                      });
                    } catch (error) {
                      console.error('❌ Error in aggressive mark as read:', error);
                      // Fallback to regular method
                      markAsReadMutation.mutate({
                        conversationId: conversation.id,
                        userId: user.id
                      });
                    }
                  }
                }}
                className={`flex items-center gap-4 p-4 hover:bg-dark-3 cursor-pointer border-b border-dark-4 ${
                  selectedConversation === conversation.id ? 'bg-dark-3' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={conversation.otherUser.image_url || "/assets/icons/profile-placeholder.svg"}
                    alt={conversation.otherUser.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineIndicator userId={conversation.otherUser.id} />
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">{conversation.unreadCount}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="base-medium text-light-1 truncate">
                    {conversation.otherUser.name}
                  </p>
                  <p className="small-regular text-light-3 truncate">
                    {conversation.last_message || "Start a conversation"}
                  </p>
                </div>
                <div className="text-light-4 subtle-semibold">
                  {conversation.last_message_at && formatTime(conversation.last_message_at)}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 p-4">
              <img
                src="/assets/icons/chat.svg"
                alt="No conversations"
                className="w-16 h-16 mb-4 opacity-50"
              />
              <p className="body-medium text-light-3 text-center">
                No conversations yet.<br />
                Start chatting with other users!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConversationData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-dark-2 border-b border-dark-4 flex items-center gap-4">
              <div className="relative">
                <img
                  src={selectedConversationData.otherUser.image_url || "/assets/icons/profile-placeholder.svg"}
                  alt={selectedConversationData.otherUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineIndicator userId={selectedConversationData.otherUser.id} size="large" />
                </div>
              </div>
              <div>
                <p className="base-medium text-light-1">{selectedConversationData.otherUser.name}</p>
                <p className="small-regular text-light-3">
                  {getOnlineStatus(selectedConversationData.otherUser.id).statusText}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center">
                  <Loader />
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((message: MessageItem) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.sender_id === user.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-3 text-light-1'
                      }`}
                    >
                      <p className="small-medium">{message.content}</p>
                      <p className={`subtle-semibold mt-1 ${
                        message.sender_id === user.id ? 'text-light-4' : 'text-light-3'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="body-medium text-light-3">No messages yet. Say hello! 👋</p>
                </div>
              )}
              
              {typingUsers.length > 0 && typingUsers.some(typingUser => typingUser.user_id !== user.id) && (
                <div className="flex justify-start">
                  <div className="bg-dark-3 px-4 py-2 rounded-lg">
                    <p className="small-medium text-light-3">
                      {typingUsers.find(typingUser => typingUser.user_id !== user.id)?.user_name} is typing...
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-dark-2 border-t border-dark-4">
              <div className="flex gap-3 relative">
                <div className="flex-1 relative">
                  <Input
                    ref={messageInputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="shad-input pr-12 bg-dark-3 border-dark-4 focus:border-primary-500"
                    disabled={sendMessageMutation.isLoading}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg hover:scale-110 transition-transform"
                  >
                    😊
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-50 bg-dark-3 border border-dark-4 rounded-lg p-4 shadow-lg max-w-xs">
                      <div className="grid grid-cols-8 gap-2">
                        {popularEmojis.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="text-lg hover:bg-dark-4 rounded p-1 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="mt-3 w-full text-xs text-light-3 hover:text-light-1 py-1"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isLoading}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    !newMessage.trim() || sendMessageMutation.isLoading
                      ? 'bg-dark-4 text-light-4 cursor-not-allowed'
                      : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {sendMessageMutation.isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <img 
                      src="/assets/icons/share.svg" 
                      alt="send" 
                      className={`w-5 h-5 ${
                        !newMessage.trim() ? 'opacity-50' : 'invert'
                      }`} 
                    />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <img
                src="/assets/icons/chat.svg"
                alt="Select conversation"
                className="w-20 h-20 mx-auto mb-4 opacity-50"
              />
              <p className="h3-bold text-light-1 mb-2">Select a conversation</p>
              <p className="body-medium text-light-3">
                Choose a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

Messenger.displayName = "Messenger";

export default Messenger;