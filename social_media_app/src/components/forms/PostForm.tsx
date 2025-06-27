import * as z from "zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Textarea,
  Input,
} from "@/components/ui";
import { PostValidation } from "@/lib/validation";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { FileUploader } from "@/components/shared";
import { useCreatePost, useUpdatePost } from "@/lib/react-query/queries";

type PostFormProps = {
  post?: {
    id: string;
    caption: string;
    image_url: string;
    image_id: string;
    location: string;
    tags: string[];
  };
  action: "Create" | "Update";
};

const PostForm = ({ post, action }: PostFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post ? post?.caption : "",
      file: [],
      location: post ? post.location : "",
      tags: post ? post.tags.join(",") : "",
    },
  });

  // Query
  const { mutateAsync: createPost, isLoading: isLoadingCreate } =
    useCreatePost();
  const { mutateAsync: updatePost, isLoading: isLoadingUpdate } =
    useUpdatePost();

  // Handler
  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    try {
      // ACTION = UPDATE
      if (post && action === "Update") {
        const updatedPost = await updatePost({
          ...value,
          postId: post.id,
          imageId: post.image_id,
          imageUrl: post.image_url,
          file: value.file || [],
        });

        if (!updatedPost) {
          toast({
            title: `${action} post failed. Please try again.`,
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Post updated successfully!",
        });
        return navigate(`/posts/${post.id}`);
      }

      // ACTION = CREATE
      const newPost = await createPost({
        ...value,
        userId: user.id,
      });

      if (!newPost) {
        toast({
          title: `${action} post failed. Please try again.`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Post created successfully!",
      });
      navigate("/");
    } catch (error) {
      console.error("Error submitting post:", error);
      toast({
        title: `${action} post failed`,
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const currentCaption = form.getValues("caption");
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = currentCaption.slice(0, start) + emoji + currentCaption.slice(end);
      
      form.setValue("caption", newText);
      
      // Reset cursor position after the emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 10);
    } else {
      form.setValue("caption", currentCaption + emoji);
    }
    
    setShowEmojiPicker(false);
  };

  const currentCaption = form.watch("caption") || "";
  const characterCount = currentCaption.length;
  const isNearLimit = characterCount > 2000;
  const isOverLimit = characterCount > 2200;
  // Check if form is valid
  const hasCaption = currentCaption.trim().length > 0;
  const hasFile = (form.watch("file") || []).length > 0;
  const isFormValid = hasCaption || hasFile;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-9 w-full max-w-5xl">
        
        {/* User Header */}
        <div className="flex items-center gap-3">
          <img 
            src={user.image_url || "/assets/icons/profile-placeholder.svg"} 
            alt={user.name}
            className="h-12 w-12 rounded-full object-cover" 
          />
          <div>
            <p className="body-bold text-light-1">{user.name}</p>
            <p className="small-medium text-light-3">@{user.username}</p>
          </div>
        </div>

        {/* Text Input with Emoji */}
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="What's on your mind?"
                    className="w-full min-h-32 p-4 rounded-lg bg-dark-3 border border-dark-4 text-light-1 placeholder:text-light-4 resize-none custom-scrollbar"
                    {...field}
                    ref={textareaRef}
                  />
                  
                  {/* Emoji Button */}
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute bottom-3 right-3 text-xl hover:scale-110 transition-transform"
                  >
                    😊
                  </button>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 right-0 z-50">
                      <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        width={300}
                        height={350}
                        searchDisabled
                        previewConfig={{
                          showPreview: false
                        }}
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              
              {/* Character Counter */}
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isOverLimit ? 'text-red' : isNearLimit ? 'text-yellow-500' : 'text-light-3'}`}>
                  {characterCount}/2200 characters
                </span>
                <FormMessage className="shad-form_message" />
              </div>
            </FormItem>
          )}
        />

        {/* Optional Image Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <img src="/assets/icons/gallery-add.svg" className="h-5 w-5" alt="gallery" />
                <FormLabel className="text-light-1 text-base">Add Photo (Optional)</FormLabel>
              </div>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  mediaUrl={post?.image_url || ""}
                  isOptional={true}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Tags (separated by comma " , ")
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Art, Expression, Learn"
                  type="text"
                  className="shad-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 items-center justify-end">
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || isLoadingCreate || isLoadingUpdate || isOverLimit}
            className="shad-button_primary whitespace-nowrap">
            {(isLoadingCreate || isLoadingUpdate) ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {action === "Create" ? "Posting..." : "Updating..."}
              </div>
            ) : (
              `${action} Post`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostForm;