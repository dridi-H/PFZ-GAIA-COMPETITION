import { useState, useEffect, useRef } from "react";
import { useUserContext } from "@/context/AuthContext";
import { Loader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
  sendTypingIndicator
} from "@/lib/supabase/messaging";

type ConversationUser = {
  id: string;
  name: string;
  username: string;
  image_url?: string;
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

const Messenger = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Queries
  const { 
    data: conversations, 
    isLoading: conversationsLoading,
    refetch: refetchConversations 
  } = useGetUserConversations(user.id);
  
  const { 
    data: messages, 
    isLoading: messagesLoading,
    refetch: refetchMessages 
  } = useGetConversationMessages(selectedConversation || "");

  const { data: searchResults } = useSearchUsersForMessaging(searchQuery, user.id);

  // Mutations
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkMessagesAsRead();
  const createConversationMutation = useGetOrCreateConversation();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user.id) return;

    // Subscribe to user conversations
    const conversationSub = subscribeToUserConversations(user.id, () => {
      refetchConversations();
    });

    return () => {
      conversationSub.unsubscribe();
    };
  }, [user.id, refetchConversations]);

  useEffect(() => {
    if (!selectedConversation) return;

    // Subscribe to messages in selected conversation
    const messagesSub = subscribeToConversationMessages(
      selectedConversation,
      (newMessage: MessageItem) => {
        // Mark as read if user is viewing the conversation
        if (newMessage.sender_id !== user.id) {
          markAsReadMutation.mutate({
            conversationId: selectedConversation,
            userId: user.id
          });
        }
        refetchMessages();
      }
    );

    // Subscribe to typing indicators
    const typingSub = subscribeToTypingIndicators(
      selectedConversation,
      setTypingUsers
    );

    return () => {
      messagesSub.unsubscribe();
      typingSub.unsubscribe();
    };
  }, [selectedConversation, user.id, markAsReadMutation, refetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    const conversation = conversations?.find(c => c.id === selectedConversation);
    if (!conversation) return;

    setNewMessage("");

    try {
      await sendMessageMutation.mutateAsync({
        content: messageContent,
        receiverId: conversation.otherUser.id,
        senderId: user.id
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleStartConversation = async (targetUser: ConversationUser) => {
    try {
      const conversation = await createConversationMutation.mutateAsync({
        user1Id: user.id,
        user2Id: targetUser.id
      });
      setSelectedConversation(conversation.id);
      setShowUserSearch(false);
      setSearchQuery("");
    } catch (error) {
      toast({
        title: "Failed to start conversation",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleTyping = () => {
    if (!selectedConversation) return;

    // Send typing indicator
    sendTypingIndicator(selectedConversation, user.id, user.name);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator logic here if needed
    }, 3000);
  };

  const formatTime = (timestamp: string) => {
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
  };

  const selectedConversationData = conversations?.find(c => c.id === selectedConversation);

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
              className="shad-button_ghost p-2"
            >
              <img src="/assets/icons/add-post.svg" alt="new chat" className="w-5 h-5" />
            </Button>
          </div>
          
          {showUserSearch && (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shad-input"
              />
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
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations && conversations.length > 0 ? (
            conversations.map((conversation: ConversationItem) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation.id);
                  setShowUserSearch(false);
                  // Mark messages as read when selecting conversation
                  if (conversation.unreadCount > 0) {
                    markAsReadMutation.mutate({
                      conversationId: conversation.id,
                      userId: user.id
                    });
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
              <img
                src={selectedConversationData.otherUser.image_url || "/assets/icons/profile-placeholder.svg"}
                alt={selectedConversationData.otherUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="base-medium text-light-1">{selectedConversationData.otherUser.name}</p>
                <p className="small-regular text-light-3">@{selectedConversationData.otherUser.username}</p>
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
              
              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-dark-3 px-4 py-2 rounded-lg">
                    <p className="small-medium text-light-3">
                      {typingUsers[0].user_name} is typing...
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-dark-2 border-t border-dark-4">
              <div className="flex gap-2">
                <Input
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
                  className="shad-input flex-1"
                  disabled={sendMessageMutation.isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isLoading}
                  className="shad-button_primary"
                >
                  {sendMessageMutation.isLoading ? (
                    <Loader />
                  ) : (
                    <img src="/assets/icons/share.svg" alt="send" className="w-5 h-5" />
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
};

export default Messenger;
