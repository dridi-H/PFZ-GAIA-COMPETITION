import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { useCreateComment } from "@/lib/react-query/commentQueries";

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

type CommentFormProps = {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
  autoFocus?: boolean;
};

const CommentForm = ({ 
  postId, 
  parentId, 
  onSuccess, 
  onCancel,
  placeholder = "Write a comment...",
  buttonText = "Post",
  autoFocus = false
}: CommentFormProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(autoFocus);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createCommentMutation = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (content.length > 500) {
      toast({
        title: "Comment too long",
        description: "Comments cannot exceed 500 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        content: content.trim(),
        postId,
        userId: user.id,
        parentId
      });

      setContent("");
      setIsExpanded(false);
      setShowEmojiPicker(false);
      onSuccess?.();
      
      toast({
        title: "Comment posted successfully!"
      });
    } catch (error) {
      toast({
        title: "Failed to post comment",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsExpanded(false);
    setShowEmojiPicker(false);
    onCancel?.();
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = content.slice(0, start) + emoji + content.slice(end);
      
      setContent(newText);
      
      // Reset cursor position after the emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 10);
    } else {
      setContent(content + emoji);
    }
    
    setShowEmojiPicker(false);
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > 500;
  const isNearLimit = characterCount > 450;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-start gap-3">
        <img
          src={user.image_url || "/assets/icons/profile-placeholder.svg"}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        
        <div className="flex-1">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleFocus}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className={`w-full p-3 pr-12 bg-dark-3 border border-dark-4 rounded-lg text-light-1 placeholder-light-3 resize-none transition-all duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none ${
                isExpanded ? 'min-h-[100px]' : 'min-h-[44px]'
              } ${isOverLimit ? 'border-red-500' : ''}`}
              rows={isExpanded ? 3 : 1}
            />
            
            {/* Emoji Button */}
            {isExpanded && (
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute top-3 right-3 text-lg hover:scale-110 transition-transform z-10"
              >
                😊
              </button>
            )}
            
            {/* Character count */}
            {isExpanded && (
              <div className={`absolute bottom-2 right-2 text-xs ${
                isOverLimit ? 'text-red-500' : 
                isNearLimit ? 'text-yellow-500' : 
                'text-light-3'
              }`}>
                {characterCount}/500
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && isExpanded && (
              <div className="absolute top-12 right-0 z-50 bg-dark-3 border border-dark-4 rounded-lg p-4 shadow-lg max-w-xs">
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

          {/* Action buttons */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="text-light-3 hover:text-light-1"
                  >
                    Cancel
                  </Button>
                )}
              </div>
              
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || isOverLimit || createCommentMutation.isLoading}
                className="shad-button_primary min-w-[60px]"
              >
                {createCommentMutation.isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Posting...</span>
                  </div>
                ) : (
                  buttonText
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default CommentForm;