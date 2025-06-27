import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { MarketplaceBackButton } from "@/components/shared";
import { useUserContext } from "@/context/AuthContext";
import { 
  useCreateMarketplaceItem, 
  useUpdateMarketplaceItem,
  useGetMarketplaceItemById 
} from "@/lib/react-query/marketplaceQueries";
import { INewMarketplaceItem } from "@/types";
import { supabase } from "@/lib/supabase/config"; // Import supabase client

// Validation schema
const MarketplaceItemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  price: z.number().min(0.01, "Price must be greater than $0").max(999999, "Price must be less than $1,000,000"),
  condition: z.enum(["New", "Like New", "Good", "Fair"]),
  location: z.string().min(2, "Location must be at least 2 characters").max(100, "Location must be less than 100 characters"),
});

const CreateMarketplaceListing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  const { id } = useParams(); // Get the ID from URL if editing
  const isEditing = !!id; // Boolean to check if we're editing
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Fetch existing item data if editing
  const { data: existingItem, isLoading: isLoadingItem } = useGetMarketplaceItemById(id);

  const { mutateAsync: createItem, isLoading: isCreating } = useCreateMarketplaceItem();
  const { mutateAsync: updateItem, isLoading: isUpdating } = useUpdateMarketplaceItem();

  const form = useForm<z.infer<typeof MarketplaceItemSchema>>({
    resolver: zodResolver(MarketplaceItemSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      condition: "Good",
      location: "",
    },
  });

  // Pre-populate form with existing data when editing
  useEffect(() => {
    if (isEditing && existingItem && !isLoadingItem) {
      console.log('🔍 Existing item data:', existingItem);
      console.log('🔍 Existing item images:', existingItem.images);
      console.log('🔍 Existing item image_paths:', existingItem.image_paths);
      
      // Check if user is the owner
      if (existingItem.seller_id !== user?.id) {
        toast({
          title: "Access Denied",
          description: "You can only edit your own listings.",
          variant: "destructive",
        });
        navigate("/marketplace");
        return;
      }

      // Set form values
      form.reset({
        title: existingItem.title,
        description: existingItem.description,
        price: existingItem.price,
        condition: existingItem.condition,
        location: existingItem.location,
      });

      // Check both images and image_paths properties
      let itemImages: string[] = [];
      
      if (existingItem.images && Array.isArray(existingItem.images) && existingItem.images.length > 0) {
        itemImages = existingItem.images;
        console.log('✅ Using images property:', itemImages);
      } else if (existingItem.image_paths && Array.isArray(existingItem.image_paths) && existingItem.image_paths.length > 0) {
        itemImages = existingItem.image_paths;
        console.log('✅ Using image_paths property:', itemImages);
      } else {
        console.log('❌ No images found in either images or image_paths');
      }

      if (itemImages.length > 0) {
        setExistingImages(itemImages);
        setImagePreviews(itemImages);
        console.log('✅ Set existing images and previews:', itemImages);
      }
    }
  }, [isEditing, existingItem, isLoadingItem, user?.id, form, navigate, toast]);

  // Debug authentication on component mount
  useEffect(() => {
    const debugAuth = async () => {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      console.log('🔍 Auth Debug:', {
        contextUser: user?.id,
        contextUserType: typeof user?.id,
        supabaseUser: authUser?.id,
        supabaseUserType: typeof authUser?.id,
        match: user?.id === authUser?.id,
        error: error
      });

      // Check if user exists in users table
      if (authUser?.id) {
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('account_id', authUser.id)
          .single();
        
        console.log('🔍 Database user lookup:', { dbUser, dbError });
        
        // Also check what the marketplace table expects
        const { data: tableInfo, error: tableError } = await supabase
          .from('marketplace_items')
          .select('seller_id')
          .limit(1);
        
        console.log('🔍 Marketplace table structure check:', { tableInfo, tableError });
      }
    };
    debugAuth();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const totalImages = existingImages.length + selectedImages.length + files.length;
    if (totalImages > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images.",
        variant: "destructive",
      });
      return;
    }

    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Create previews for new files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const totalExistingImages = existingImages.length;
    
    if (index < totalExistingImages) {
      // Removing an existing image
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExistingImages);
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Removing a new image
      const newImageIndex = index - totalExistingImages;
      const newImages = selectedImages.filter((_, i) => i !== newImageIndex);
      setSelectedImages(newImages);
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (values: z.infer<typeof MarketplaceItemSchema>) => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to create a listing.",
          variant: "destructive",
        });
        return;
      }

      if (isEditing) {
        // Update existing item - preserve existing images and add new ones
        console.log('✅ Updating item with ID:', id);
        console.log('🔍 Existing images to preserve:', existingImages);
        console.log('🔍 New images to add:', selectedImages.length);
        
        const updateData = {
          itemId: id!,
          title: values.title,
          description: values.description,
          price: values.price,
          condition: values.condition,
          location: values.location,
          images: existingImages, // Preserve existing images
          newImages: selectedImages.length > 0 ? selectedImages : undefined, // Add new images if any
        };

        console.log('📝 Update data being sent:', {
          ...updateData,
          images: `${existingImages.length} existing images`,
          newImages: `${selectedImages.length} new images`
        });

        await updateItem(updateData);
        
        toast({
          title: "Success!",
          description: "Your listing has been updated successfully.",
        });
      } else {
        // Create new item
        console.log('✅ Creating item with user ID:', user.id);

        const itemData: INewMarketplaceItem = {
          userId: user.id, // The API function will handle the ID mapping
          title: values.title,
          description: values.description,
          price: values.price,
          condition: values.condition,
          location: values.location,
          images: selectedImages,
        };

        console.log('📝 Item data being sent:', {
          ...itemData,
          images: `${selectedImages.length} files`
        });

        await createItem(itemData);
        
        toast({
          title: "Success!",
          description: "Your listing has been created successfully.",
        });
      }
      
      navigate("/marketplace");
    } catch (error) {
      console.error(`❌ Error ${isEditing ? 'updating' : 'creating'} listing:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} listing. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Show loading state when fetching item data for editing
  if (isEditing && isLoadingItem) {
    return (
      <div className="create-listing-container">
        <div className="create-listing-inner_container">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-light-3">Loading item data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalImages = existingImages.length + selectedImages.length;
  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="create-listing-container">
      <div className="create-listing-inner_container">
        <div className="hidden md:flex max-w-5xl w-full">
          <MarketplaceBackButton to="/marketplace" />
        </div>
        
        {/* Header */}
        <div className="create-listing-header">
          <div className="flex flex-col">
            <h2 className="h3-bold md:h2-bold text-left w-full">
              {isEditing ? "Edit Listing" : "Create Listing"}
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-1">
              {isEditing 
                ? "Update your marketplace listing" 
                : "List your item for sale in the marketplace"
              }
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="create-listing-form">
            {/* Images Upload */}
            <div className="create-listing-images-section">
              <h3 className="body-bold text-light-1 mb-4">Photos (Optional)</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Upload Button */}
                {totalImages < 5 && (
                  <label className="create-listing-image-upload">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="create-listing-upload-placeholder">
                      <Upload className="h-8 w-8 text-light-4 mb-2" />
                      <p className="text-light-4 small-medium">Add Photo</p>
                      <p className="text-light-4 tiny-medium">{totalImages}/5</p>
                    </div>
                  </label>
                )}
                
                {/* Image Previews */}
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="create-listing-image-preview">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-dark-1/80 rounded-full hover:bg-red/80 transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                    {/* Indicator for existing vs new images */}
                    {index < existingImages.length && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500/80 rounded text-xs text-white">
                        Existing
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="create-listing-basic-section">
              <h3 className="body-bold text-light-1 mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="shad-form_label">Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="What are you selling?"
                          className="shad-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="shad-form_message" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="shad-form_label">Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your item, its condition, and any other relevant details..."
                          className="shad-textarea resize-none min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center mt-1">
                        <FormMessage className="shad-form_message" />
                        <span className="text-light-4 tiny-medium">
                          {field.value?.length || 0}/1000
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Price *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-4 h-4 w-4" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="shad-input pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="shad-form_message" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Condition *</FormLabel>
                      <FormControl>
                        <select 
                          className="h-12 bg-dark-4 border-none text-white focus:ring-2 focus:ring-primary-500 focus:outline-none px-3 rounded-lg w-full appearance-none cursor-pointer"
                          style={{
                            backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23A8A8A8' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>\")",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 12px center",
                            backgroundSize: "12px"
                          }}
                          {...field}
                        >
                          <option value="New" className="bg-dark-4 text-white">New</option>
                          <option value="Like New" className="bg-dark-4 text-white">Like New</option>
                          <option value="Good" className="bg-dark-4 text-white">Good</option>
                          <option value="Fair" className="bg-dark-4 text-white">Fair</option>
                        </select>
                      </FormControl>
                      <FormMessage className="shad-form_message" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="shad-form_label">Location *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City, State"
                          className="shad-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="shad-form_message" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="create-listing-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/marketplace")}
                className="shad-button_dark_4"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shad-button_primary"
              >
                {isSubmitting 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Listing" : "Post Listing")
                }
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateMarketplaceListing;