import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  createMarketplaceItem, 
  getMarketplaceItems, 
  getMarketplaceItemById, 
  updateMarketplaceItem, 
  deleteMarketplaceItem,
  getUserMarketplaceItems,
  toggleMarketplaceFavorite,
  getUserMarketplaceFavorites,
  isMarketplaceItemFavorited,
  markItemAsSold,
  markItemAsActive // You'll need to add this to your API file
} from "@/lib/supabase/api";
import { INewMarketplaceItem, IUpdateMarketplaceItem } from "@/types";
import { toast } from "@/components/ui/use-toast";

// ============================================================
// MARKETPLACE QUERIES
// ============================================================

export const MARKETPLACE_QUERY_KEYS = {
  GET_MARKETPLACE_ITEMS: "getMarketplaceItems",
  GET_MARKETPLACE_ITEM: "getmarketplaceItem",
  GET_USER_MARKETPLACE_ITEMS: "getUserMarketplaceItems",
  GET_USER_MARKETPLACE_FAVORITES: "getUserMarketplaceFavorites",
  GET_MARKETPLACE_ITEM_FAVORITED: "getMarketplaceItemFavorited",
};

// ============================== GET MARKETPLACE ITEMS
export const useGetMarketplaceItems = (params?: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEMS, params],
    queryFn: () => getMarketplaceItems(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// ============================== GET MARKETPLACE ITEM BY ID
export const useGetMarketplaceItemById = (itemId?: string) => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEM, itemId],
    queryFn: () => getMarketplaceItemById(itemId!),
    enabled: !!itemId,
  });
};

// ============================== GET USER'S MARKETPLACE ITEMS
export const useGetUserMarketplaceItems = (userId: string, status?: 'active' | 'sold' | 'expired') => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEYS.GET_USER_MARKETPLACE_ITEMS, userId, status],
    queryFn: () => getUserMarketplaceItems(userId, status),
    enabled: !!userId,
  });
};

// ============================== GET USER'S MARKETPLACE FAVORITES
export const useGetUserMarketplaceFavorites = (userId: string) => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEYS.GET_USER_MARKETPLACE_FAVORITES, userId],
    queryFn: () => getUserMarketplaceFavorites(userId),
    enabled: !!userId,
  });
};

// ============================== CHECK IF ITEM IS FAVORITED
export const useIsMarketplaceItemFavorited = (userId: string, itemId: string) => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEM_FAVORITED, userId, itemId],
    queryFn: () => isMarketplaceItemFavorited(userId, itemId),
    enabled: !!userId && !!itemId,
  });
};

// ============================================================
// MARKETPLACE MUTATIONS
// ============================================================

// ============================== CREATE MARKETPLACE ITEM
export const useCreateMarketplaceItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (item: INewMarketplaceItem) => createMarketplaceItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEMS],
      });
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_USER_MARKETPLACE_ITEMS],
      });
      toast({
        title: "Success!",
        description: "Your item has been listed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
      console.error("Create marketplace item error:", error);
    },
  });
};

// ============================== UPDATE MARKETPLACE ITEM
export const useUpdateMarketplaceItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (item: IUpdateMarketplaceItem) => updateMarketplaceItem(item),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEMS],
      });
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEM, data.id],
      });
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_USER_MARKETPLACE_ITEMS],
      });
      toast({
        title: "Success!",
        description: "Your listing has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update listing. Please try again.",
        variant: "destructive",
      });
      console.error("Update marketplace item error:", error);
    },
  });
};

// ============================== DELETE MARKETPLACE ITEM
export const useDeleteMarketplaceItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, imagePaths }: { itemId: string; imagePaths?: string[] }) => 
      deleteMarketplaceItem(itemId, imagePaths),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEMS],
      });
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_USER_MARKETPLACE_ITEMS],
      });
      toast({
        title: "Success!",
        description: "Your listing has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete listing. Please try again.",
        variant: "destructive",
      });
      console.error("Delete marketplace item error:", error);
    },
  });
};

// ============================== TOGGLE MARKETPLACE FAVORITE
export const useToggleMarketplaceFavorite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, itemId }: { userId: string; itemId: string }) =>
      toggleMarketplaceFavorite(userId, itemId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_USER_MARKETPLACE_FAVORITES, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEM_FAVORITED, variables.userId, variables.itemId],
      });
      toast({
        title: data.favorited ? "Added to favorites!" : "Removed from favorites",
        description: data.favorited ? "You can find this item in your favorites." : "Item removed from your favorites.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
      console.error("Toggle marketplace favorite error:", error);
    },
  });
};

// ============================== MARK ITEM AS SOLD
export const useMarkItemAsSold = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, userId }: { itemId: string; userId: string }) =>
      markItemAsSold(itemId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEMS],
      });
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_USER_MARKETPLACE_ITEMS],
      });
      toast({
        title: "Success!",
        description: "Item marked as sold.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark item as sold. Please try again.",
        variant: "destructive",
      });
      console.error("Mark item as sold error:", error);
    },
  });
};

// ============================== MARK ITEM AS ACTIVE (REACTIVATE)
export const useMarkItemAsActive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, userId }: { itemId: string; userId: string }) =>
      markItemAsActive(itemId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_MARKETPLACE_ITEMS],
      });
      queryClient.invalidateQueries({
        queryKey: [MARKETPLACE_QUERY_KEYS.GET_USER_MARKETPLACE_ITEMS],
      });
      toast({
        title: "Success!",
        description: "Item marked as active.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reactivate item. Please try again.",
        variant: "destructive",
      });
      console.error("Mark item as active error:", error);
    },
  });
};