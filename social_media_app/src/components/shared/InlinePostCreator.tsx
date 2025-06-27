import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Button,
  Input,
  Textarea,
} from "@/components/ui";
import { PostValidation } from "@/lib/validation";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { FileUploader, Loader } from "@/components/shared";
import { useCreatePost } from "@/lib/react-query/queries";

// Simple emoji data
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

type InlinePostCreatorProps = {
  onPostCreated?: () => void;
};

const InlinePostCreator = ({ onPostCreated }: InlinePostCreatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { toast } = useToast();
  const { user } = useUserContext();
  
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: "",
      file: [],
      tags: "",
    },
  });

  const { mutateAsync: createPost, isLoading: isLoadingCreate } = useCreatePost();

  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    try {
      console.log('📝 Submitting post:', value);
      
      const newPost = await createPost({
        ...value,
        userId: user.id,
      });

      if (!newPost) {
        toast({
          title: "Failed to create post. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Post created successfully!",
      });
      
      // Reset form and collapse
      form.reset();
      setIsExpanded(false);
      setShowEmojiPicker(false);
      
      // Notify parent component to refresh feed
      onPostCreated?.();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Failed to create post",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsExpanded(false);
    setShowEmojiPicker(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleEmojiClick = (emoji: string) => {
    const currentCaption = form.getValues("caption");
    form.setValue("caption", currentCaption + emoji);
    setShowEmojiPicker(false);
  };

  // Get current form values for validation - Fixed TypeScript issues
  const currentCaption = form.watch("caption") || "";
  const currentFile = form.watch("file") || [];
  const captionLength = currentCaption.length;
  const hasCaption = currentCaption.trim().length > 0;
  const hasFile = Array.isArray(currentFile) && currentFile.length > 0;
  const canSubmit = hasCaption || hasFile;

  // Compact view
  if (!isExpanded) {
    return (
      <div className="w-full bg-dark-2 rounded-xl p-4 mb-6">
        <div 
          className="flex items-center gap-4 cursor-pointer"
          onClick={handleExpand}
        >
          <img
            src={user.image_url || "/assets/icons/profile-placeholder.svg"}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 bg-dark-3 rounded-full py-3 px-4 text-light-3 hover:bg-dark-4 transition-colors">
            What's on your mind, {user.name}?
          </div>
        </div>
        
        <div className="flex items-center justify-center mt-4 pt-3 border-t border-dark-4">
          <button 
            className="flex items-center gap-2 px-6 py-2 rounded-lg hover:bg-dark-3 transition-colors text-light-2"
            onClick={handleExpand}
          >
            <img src="/assets/icons/edit.svg" alt="create post" className="w-5 h-5" />
            <span className="small-medium">Create a post</span>
          </button>
        </div>
      </div>
    );
  }

  // Expanded form view
  return (
    <div className="w-full bg-dark-2 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-4 mb-6">
        <img
          src={user.image_url || "/assets/icons/profile-placeholder.svg"}
          alt="profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="base-medium text-light-1">{user.name}</p>
          <p className="small-regular text-light-3">@{user.username}</p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Caption with Emoji Picker */}
          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Textarea
                      className="shad-textarea custom-scrollbar min-h-[120px] border-none bg-transparent resize-none text-light-1 placeholder:text-light-3 pr-12"
                      placeholder="What's on your mind?"
                      {...field}
                    />
                    
                    {/* Emoji Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute bottom-3 right-3 text-xl hover:scale-110 transition-transform z-10"
                    >
                      😊
                    </button>
                  </div>
                </FormControl>
                
                {/* Character Counter */}
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${captionLength > 2000 ? 'text-red-500' : 'text-light-3'}`}>
                    {captionLength}/2200 characters
                  </span>
                  {!canSubmit && (
                    <span className="text-sm text-orange-500">
                      Add text or image to post
                    </span>
                  )}
                </div>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="relative">
                    <div className="absolute top-2 left-0 z-50 bg-dark-3 border border-dark-4 rounded-lg p-4 shadow-lg max-w-xs">
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
                  </div>
                )}
                
                <FormMessage className="shad-form_message" />
              </FormItem>
            )}
          />

          {/* Optional Image Upload */}
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2 mb-2">
                  <img src="/assets/icons/gallery-add.svg" className="h-4 w-4" />
                  <span className="text-sm text-light-2">Add Photo (Optional)</span>
                </div>
                <FormControl>
                  <FileUploader
                    fieldChange={field.onChange}
                    mediaUrl=""
                  />
                </FormControl>
                <FormMessage className="shad-form_message" />
              </FormItem>
            )}
          />

          {/* Tags Only (Removed Location) */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Add tags (Art, Expression, Learn) - Optional"
                    type="text"
                    className="shad-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="shad-form_message" />
              </FormItem>
            )}
          />

          <div className="flex gap-4 items-center justify-end pt-4 border-t border-dark-4">
            <Button
              type="button"
              className="shad-button_dark_4"
              onClick={handleCancel}
              disabled={isLoadingCreate}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`whitespace-nowrap ${canSubmit ? 'shad-button_primary' : 'shad-button_dark_4'}`}
              disabled={isLoadingCreate || !canSubmit}
            >
              {isLoadingCreate && <Loader />}
              {isLoadingCreate ? "Posting..." : "Share Post"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InlinePostCreator;