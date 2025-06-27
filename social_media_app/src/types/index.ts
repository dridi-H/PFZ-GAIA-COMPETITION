export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
};

export type INewPost = {
  userId: string;
  caption: string;
  file?: File[]; // Make optional
  location?: string;
  tags?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  image_url: string; // Changed from imageUrl to image_url
  bio: string;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

// Supabase Database Types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          username: string;
          email: string;
          bio: string;
          image_url: string;
          image_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          username: string;
          email: string;
          bio?: string;
          image_url?: string;
          image_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          name?: string;
          username?: string;
          email?: string;
          bio?: string;
          image_url?: string;
          image_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          creator: string;
          caption: string;
          image_url: string;
          image_id: string;
          location: string;
          tags: string[];
          likes: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator: string;
          caption: string;
          image_url: string;
          image_id: string;
          location?: string;
          tags?: string[];
          likes?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator?: string;
          caption?: string;
          image_url?: string;
          image_id?: string;
          location?: string;
          tags?: string[];
          likes?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      saves: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Additional types for application use
export type Post = {
  id: string;
  creator: string;
  caption: string;
  image_url: string;
  image_id: string;
  location: string;
  tags: string[];
  likes: string[];
  created_at: string;
  updated_at: string;
};

// Comment types
export interface IComment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  likes: string[];
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user: {
    id: string;
    name: string;
    username: string;
    image_url: string;
  };
  replies?: IComment[];
}

export interface INewComment {
  content: string;
  postId: string;
  userId: string;
  parentId?: string;
}

export interface IUpdateComment {
  commentId: string;
  content: string;
}

// ============================================================
// MARKETPLACE TYPES
// ============================================================

export interface IMarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  category?: IMarketplaceCategory;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  location: string;
  images: string[];
  image_paths: string[];
  seller_id: string;
  seller: IUser;
  status: 'active' | 'sold' | 'expired';
  created_at: string;
  updated_at: string;
  sold_at?: string;
  is_favorited?: boolean;
  favorites_count?: number;
}

export interface INewMarketplaceItem {
  userId: string;
  title: string;
  description: string;
  price: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  location: string;
  images?: File[];
}
export interface IUpdateMarketplaceItem {
  itemId: string;
  title: string;
  description: string;
  price: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  location: string;
  images?: string[];
  newImages?: File[]; 
}

export interface IMarketplaceCategory {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export interface IMarketplaceFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  sortBy?: 'price_low' | 'price_high' | 'newest' | 'popular';
  searchQuery?: string;
}

export interface IMarketplaceFavorite {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}

export interface IMarketplaceInquiry {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
  created_at: string;
  item: IMarketplaceItem;
  buyer: IUser;
}
