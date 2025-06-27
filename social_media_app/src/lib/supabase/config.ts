import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

// Debug configuration
console.log('Supabase Config:', {
  url: supabaseConfig.url,
  anonKeyPrefix: supabaseConfig.anonKey?.substring(0, 20) + '...',
});

// Create Supabase client with additional options
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Test connection on startup
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Initial session check:', { data: data.session ? 'Session exists' : 'No session', error });
});

// Database and storage bucket IDs
export const STORAGE_BUCKETS = {
  POST_IMAGES: 'post-images',
  AVATARS: 'avatars',
  MARKETPLACE_IMAGES: 'marketplace-images',
};

// Table names
export const TABLES = {
  USERS: 'users',
  POSTS: 'posts',
  SAVES: 'saves',
  COMMENTS: 'comments',
  MARKETPLACE_CATEGORIES: 'marketplace_categories',
  MARKETPLACE_ITEMS: 'marketplace_items',
  MARKETPLACE_FAVORITES: 'marketplace_favorites',
  MARKETPLACE_INQUIRIES: 'marketplace_inquiries',
};
