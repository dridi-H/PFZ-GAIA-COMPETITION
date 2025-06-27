import { supabase, STORAGE_BUCKETS, TABLES } from './config';
import { INewPost, INewUser, IUpdatePost, IUpdateUser, INewComment, IUpdateComment, INewMarketplaceItem, IUpdateMarketplaceItem } from '@/types';

  // ============================================================
  // AUTH
  // ============================================================

  // ============================== SIGN UP
  export async function createUserAccount(user: INewUser) {
    try {
      console.log('🚀 Starting signup process with:', {
        email: user.email,
        name: user.name,
        username: user.username,
        emailValid: user.email.includes('@') && user.email.includes('.'),
        passwordLength: user.password.length
      });

      // Enhanced email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        throw new Error(`Invalid email format: ${user.email}. Please use a valid email like user@gmail.com`);
      }

      // Check for common problematic domains
      const normalizedEmail = user.email.trim().toLowerCase();
      const emailDomain = normalizedEmail.split('@')[1];
      
      // List of domains that commonly work with Supabase
      const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'test.com', 'demo.org', 'example.org', 'icloud.com'];
      
      console.log('📧 Email domain check:', {
        email: normalizedEmail,
        domain: emailDomain,
        isAllowedDomain: allowedDomains.includes(emailDomain)
      });

      // Validate password strength
      if (user.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check for basic password requirements
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
        console.warn('⚠️ Password lacks complexity but will attempt signup');
      }

      // Validate username
      if (!user.username || user.username.length < 2) {
        throw new Error('Username must be at least 2 characters long');
      }

      // Check for reserved usernames
      const reservedUsernames = ['admin', 'root', 'user', 'test', 'null', 'undefined'];
      if (reservedUsernames.includes(user.username.toLowerCase())) {
        throw new Error('Username is reserved. Please choose a different username.');
      }

      console.log('✅ All validation checks passed, calling Supabase auth...');

      // Create auth account with additional metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: user.password,
        options: {
          data: {
            name: user.name.trim(),
            username: user.username.trim(),
            email_domain: emailDomain,
            signup_timestamp: new Date().toISOString()
          }
        }
      });

      console.log('📧 Supabase auth.signUp response:', {
        success: !authError,
        hasUser: !!authData.user,
        userEmail: authData.user?.email,
        userConfirmed: authData.user?.email_confirmed_at ? 'Confirmed' : 'Pending',
        authError: authError ? {
          message: authError.message,
          status: authError.status,
          name: authError.name
        } : null
      });

      if (authError) {
        console.error('❌ Auth error details:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!authData.user) {
        throw new Error('No user returned from Supabase auth signup');
      }

      console.log('✅ User created in auth, now creating profile...');
      
      // DETAILED DEBUG LOGGING
      console.log('🔍 Debug Info:', {
        authUserId: authData.user.id,
        authUserIdType: typeof authData.user.id,
        authUserIdLength: authData.user.id.length,
        authUserEmail: authData.user.email,
        authUserConfirmed: authData.user.email_confirmed_at,
        sessionExists: !!authData.session
      });

      // Check current session and auth state
      const { data: currentSession, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 Current session check:', {
        hasSession: !!currentSession.session,
        sessionUserId: currentSession.session?.user?.id,
        sessionError: sessionError,
        idsMatch: currentSession.session?.user?.id === authData.user.id
      });

      // Create user profile in database
      const newUser = await saveUserToDB({
        accountId: authData.user.id,
        name: user.name,
        email: user.email.trim().toLowerCase(),
        username: user.username,
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      });

      console.log('✅ User profile created successfully:', {
        profileId: newUser?.id,
        username: newUser?.username
      });

      return newUser;
    } catch (error) {
      console.error('❌ Complete signup error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          throw new Error(`Email error: ${error.message}. Please use a valid email address like user@gmail.com`);
        }
        if (error.message.includes('password')) {
          throw new Error(`Password error: ${error.message}`);
        }
        throw error;
      }
      
      throw new Error('An unexpected error occurred during signup');
    }
  }

  // ============================== SAVE USER TO DB
  export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    imageUrl: string;
    username: string;
  }) {
    try {
      console.log('💾 Starting saveUserToDB with data:', {
        accountId: user.accountId,
        accountIdType: typeof user.accountId,
        accountIdLength: user.accountId.length,
        email: user.email,
        name: user.name,
        username: user.username
      });

      // Check current authentication state
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      console.log('🔐 Current auth state during save:', {
        hasCurrentUser: !!currentUser,
        currentUserId: currentUser?.id,
        currentUserEmail: currentUser?.email,
        idsMatch: currentUser?.id === user.accountId,
        userError: userError
      });

      // Check auth.uid() directly
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Session data during save:', {
        hasSession: !!sessionData.session,
        sessionUserId: sessionData.session?.user?.id,
        sessionError: sessionError
      });

      // Prepare the insert data
      const insertData = {
        account_id: user.accountId,
        name: user.name,
        username: user.username,
        email: user.email,
        image_url: user.imageUrl,
      };

      console.log('📝 Insert data prepared:', insertData);

      // Attempt the insert with detailed error capture
      console.log('🚀 Attempting database insert...');
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          insertData: insertData
        });
        throw error;
      }

      console.log('✅ User successfully saved to database:', {
        userId: data.id,
        username: data.username,
        email: data.email
      });

      return data;
    } catch (error) {
      console.error('❌ Complete saveUserToDB error:', error);
      throw error;
    }
  }

  // ============================== SIGN IN
  export async function signInAccount(user: { email: string; password: string }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // ============================== GET ACCOUNT
  export async function getAccount() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('getAccount - Raw response:', { user: user ? 'User exists' : 'No user', error });
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  }

  // ============================== GET USER
  export async function getCurrentUser() {
    try {
      console.log('getCurrentUser - Starting...');
      const account = await getAccount();
      console.log('getCurrentUser - Account:', account ? { id: account.id, email: account.email } : 'No account');
      
      if (!account) {
        console.log('getCurrentUser - No account found, returning null');
        return null;
      }

      console.log('getCurrentUser - Querying users table with account_id:', account.id);
      
      // First get the user data
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('account_id', account.id)
        .maybeSingle();

      if (userError) {
        console.error('getCurrentUser - Database error:', userError);
        throw userError;
      }

      if (!userData) {
        console.log('getCurrentUser - No user data found');
        return null;
      }

      // Then get the saves data separately
      const { data: savesData, error: savesError } = await supabase
        .from(TABLES.SAVES)
        .select('id, post_id, created_at')
        .eq('user_id', userData.id);

      if (savesError) {
        console.error('getCurrentUser - Saves error:', savesError);
        // Don't throw here, just log and continue without saves
      }

      // Combine the data
      const result = {
        ...userData,
        saves: savesData || []
      };

      console.log('getCurrentUser - Database response:', { 
        data: { id: result.id, username: result.username, savesCount: result.saves.length },
        error: null 
      });

      return result;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // ============================== SIGN OUT
  export async function signOutAccount() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // ============================== FORGOT PASSWORD
  export async function forgotPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // ============================================================
  // POSTS
  // ============================================================

  // Replace your createPost function with this corrected version

  export async function createPost(post: INewPost) {
    try {
      console.log('🔥 Creating post with data:', post);

      let imageUrl: string | null = null;
      let imageId: string | null = null;

      // Only upload image if file is provided
      if (post.file && post.file.length > 0) {
        console.log('📸 Uploading image...');
        const uploadedFile = await uploadFile(post.file[0]);
        if (!uploadedFile) throw new Error('Failed to upload image');
        
        imageUrl = getFilePreview(uploadedFile.path);
        imageId = uploadedFile.path;
        console.log('✅ Image uploaded successfully:', { imageUrl, imageId });
      } else {
        console.log('📝 Creating text-only post (no image)');
      }

      // Prepare the post data for Supabase
      const postData: any = {
        creator: post.userId, // Use 'creator' to match your database schema
        caption: post.caption || "",
        tags: post.tags ? post.tags.replace(/ /g, "").split(",").filter(tag => tag.length > 0) : [],
      };

      // Only add image fields if they exist
      if (imageUrl) {
        postData.image_url = imageUrl;
      }
      
      if (imageId) {
        postData.image_id = imageId;
      }

      // Add location if provided
      if (post.location) {
        postData.location = post.location;
      }

      console.log('📄 Post data to be saved:', postData);

      // Insert the post into Supabase
      const { data: newPost, error } = await supabase
        .from(TABLES.POSTS)
        .insert([postData])
        .select(`
          *,
          creator:users!posts_creator_fkey (
            id,
            name,
            username,
            image_url
          )
        `)
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        
        // If image was uploaded but post creation failed, try to delete it
        if (imageId) {
          try {
            await deleteFile(imageId);
            console.log('🗑️ Cleaned up uploaded image after post creation failure');
          } catch (cleanupError) {
            console.error('❌ Failed to cleanup uploaded image:', cleanupError);
          }
        }
        
        throw new Error(error.message || 'Failed to create post');
      }

      if (!newPost) {
        throw new Error('Failed to create post - no data returned');
      }

      console.log('✅ Post created successfully:', newPost);
      return newPost;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      
      // If we uploaded an image but failed later, try to clean it up
      if (imageId) {
        try {
          await deleteFile(imageId); 
          console.log('🗑️ Cleaned up uploaded image after error');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup uploaded image:', cleanupError);
        }
      }
      
      throw error;
    }
  }

  // ============================== UPLOAD FILE
  export async function uploadFile(file: File) {
    try {
      // Safety check for file existence
      if (!file) {
        throw new Error('No file provided for upload');
      }

      // Validate file properties
      if (!file.name) {
        throw new Error('File must have a name');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      console.log('📁 Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const fileExt = file.name.split('.').pop();
      if (!fileExt) {
        throw new Error('File must have a valid extension');
      }

      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.POST_IMAGES)
        .upload(filePath, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('✅ File uploaded successfully:', data.path);
      return { path: data.path };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // ============================== GET FILE URL
  export function getFilePreview(filePath: string) {
    try {
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.POST_IMAGES)
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file preview:', error);
      return null;
    }
  }

  // ============================== DELETE FILE
  export async function deleteFile(filePath: string) {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.POST_IMAGES)
        .remove([filePath]);

      if (error) throw error;
      return { status: 'ok' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // ============================== GET POSTS
  export async function searchPosts(searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          creator:users!posts_creator_fkey(*)
        `)
        .textSearch('caption', searchTerm)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { documents: data };
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }

  export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
    try {
      const limit = 9;
      const from = pageParam * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          creator:users!posts_creator_fkey(*)
        `)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { documents: data };
    } catch (error) {
      console.error('Error getting infinite posts:', error);
      throw error;
    }
  }

  // ============================== GET POST BY ID
  export async function getPostById(postId?: string) {
    if (!postId) throw new Error('Post ID is required');

    try {
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          creator:users!posts_creator_fkey(*)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting post by ID:', error);
      throw error;
    }
  }

  // ============================== UPDATE POST
  export async function updatePost(post: IUpdatePost) {
    const hasFileToUpdate = post.file.length > 0;

    try {
      let image = {
        imageUrl: post.imageUrl,
        imageId: post.imageId,
      };

      if (hasFileToUpdate) {
        // Upload new file
        const uploadedFile = await uploadFile(post.file[0]);
        if (!uploadedFile) throw new Error('Failed to upload file');

        // Get new file URL
        const fileUrl = getFilePreview(uploadedFile.path);
        if (!fileUrl) {
          await deleteFile(uploadedFile.path);
          throw new Error('Failed to get file URL');
        }

        image = { imageUrl: fileUrl, imageId: uploadedFile.path };
      }

      // Convert tags into array
      const tags = post.tags?.replace(/\s/g, '').split(',').filter(tag => tag) || [];

      // Update post
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .update({
          caption: post.caption,
          image_url: image.imageUrl,
          image_id: image.imageId,
          location: post.location || '',
          tags: tags,
        })
        .eq('id', post.postId)
        .select(`
          *,
          creator:users!posts_creator_fkey(*)
        `)
        .single();

      if (error) {
        if (hasFileToUpdate) {
          await deleteFile(image.imageId);
        }
        throw error;
      }

      // Delete old file if new file was uploaded
      if (hasFileToUpdate && post.imageId) {
        await deleteFile(post.imageId);
      }

      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // ============================== DELETE POST
  export async function deletePost(postId?: string, imageId?: string) {
    if (!postId) throw new Error('Post ID is required');

    try {
      const { error } = await supabase
        .from(TABLES.POSTS)
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Delete associated image if provided
      if (imageId) {
        await deleteFile(imageId);
      }

      return { status: 'ok' };
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // ============================== LIKE / UNLIKE POST
  export async function likePost(postId: string, likesArray: string[]) {
    try {
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .update({ likes: likesArray })
        .eq('id', postId)
        .select(`
          *,
          creator:users!posts_creator_fkey(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  // ============================== SAVE POST
  export async function savePost(userId: string, postId: string) {
    try {
      console.log('💾 Attempting to save post:', { userId, postId });

      // First check if the post is already saved
      const { data: existingSave, error: checkError } = await supabase
        .from(TABLES.SAVES)
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing save:', checkError);
        throw checkError;
      }

      if (existingSave) {
        console.log('⚠️ Post already saved, returning existing save');
        return existingSave;
      }

      // Insert new save
      const { data, error } = await supabase
        .from(TABLES.SAVES)
        .insert({
          user_id: userId,
          post_id: postId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting save:', error);
        throw error;
      }

      console.log('✅ Post saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  }

  // ============================== DELETE SAVED POST
  export async function deleteSavedPost(savedRecordId: string) {
    try {
      const { error } = await supabase
        .from(TABLES.SAVES)
        .delete()
        .eq('id', savedRecordId);

      if (error) throw error;
      return { status: 'ok' };
    } catch (error) {
      console.error('Error deleting saved post:', error);
      throw error;
    }
  }

  // ============================== GET SAVED POSTS BY USER
  export async function getSavedPostsByUser(userId?: string) {
    if (!userId) return { documents: [] };

    try {
      console.log('🔍 Getting saved posts for user:', userId);
      
      const { data, error } = await supabase
        .from(TABLES.SAVES)
        .select(`
          id,
          created_at,
          post:posts!saves_post_id_fkey(
            *,
            creator:users!posts_creator_fkey(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Extract the posts from the saves and filter out any null posts
      const posts = data?.map(save => save.post).filter(Boolean) || [];
      
      console.log('✅ Found saved posts:', posts.length);
      return { documents: posts };
    } catch (error) {
      console.error('Error getting saved posts:', error);
      return { documents: [] };
    }
  }

  // ============================== GET USER'S POSTS
  export async function getUserPosts(userId?: string) {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          creator:users!posts_creator_fkey(*)
        `)
        .eq('creator', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { documents: data };
    } catch (error) {
      console.error('Error getting user posts:', error);
      throw error;
    }
  }

  // ============================== GET RECENT POSTS
  export async function getRecentPosts() {
    try {
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          creator:users!posts_creator_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return { documents: data };
    } catch (error) {
      console.error('Error getting recent posts:', error);
      throw error;
    }
  }

  // ============================================================
  // USER
  // ============================================================

  // ============================== GET USERS
  export async function getUsers(limit?: number) {
    try {
      let query = supabase
        .from(TABLES.USERS)
        .select('*')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { documents: data };
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // ============================== GET USER BY ID
  export async function getUserById(userId: string) {
    // Add validation to prevent undefined IDs
    if (!userId || userId === 'undefined') {
      console.warn('getUserById called with invalid userId:', userId);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // ============================== UPDATE USER
  export async function updateUser(user: IUpdateUser) {
    const hasFileToUpdate = user.file.length > 0;

    try {
      let image = {
        imageUrl: user.imageUrl,
        imageId: user.imageId,
      };

      if (hasFileToUpdate) {
        // Upload new file to avatars bucket
        const uploadedFile = await uploadUserAvatar(user.file[0]);
        if (!uploadedFile) throw new Error('Failed to upload avatar');

        // Get new file URL
        const fileUrl = getUserAvatarUrl(uploadedFile.path);
        if (!fileUrl) {
          await deleteUserAvatar(uploadedFile.path);
          throw new Error('Failed to get avatar URL');
        }

        image = { imageUrl: fileUrl, imageId: uploadedFile.path };
      }

      // Update user
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          name: user.name,
          bio: user.bio,
          image_url: image.imageUrl,
          image_id: image.imageId,
        })
        .eq('id', user.userId)
        .select()
        .single();

      if (error) {
        if (hasFileToUpdate) {
          await deleteUserAvatar(image.imageId);
        }
        throw error;
      }

      // Delete old avatar if new one was uploaded
      if (hasFileToUpdate && user.imageId) {
        await deleteUserAvatar(user.imageId);
      }

      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // ============================== AVATAR UTILITIES
  export async function uploadUserAvatar(file: File) {
    try {
      // Add same safety checks as uploadFile
      if (!file) {
        throw new Error('No file provided for upload');
      }

      if (!file.name) {
        throw new Error('File must have a name');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(filePath, file);

      if (error) throw error;
      return { path: data.path };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  export function getUserAvatarUrl(filePath: string) {
    try {
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return null;
    }
  }

  // ============================== GET LIKED POSTS BY USER
  export async function getLikedPostsByUser(userId?: string) {
    if (!userId) return { documents: [] };

    try {
      // Query posts where the user's ID is in the likes array
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          creator:users!posts_creator_fkey(*)
        `)
        .contains('likes', [userId])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { documents: data || [] };
    } catch (error) {
      console.error('Error getting liked posts:', error);
      return { documents: [] };
    }
  }

  export async function deleteUserAvatar(filePath: string) {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .remove([filePath]);

      if (error) throw error;
      return { status: 'ok' };
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  }

  // ============================================================
  // COMMENTS
  // ============================================================

  // ============================== CREATE COMMENT
  export async function createComment({ content, postId, userId, parentId }: INewComment) {
    try {
      console.log('🚀 Creating comment:', { content: content.substring(0, 50) + '...', postId, userId, parentId });

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Comment content cannot be empty');
      }

      if (content.length > 500) {
        throw new Error('Comment cannot exceed 500 characters');
      }

      // Check if post exists
      const { data: post, error: postError } = await supabase
        .from(TABLES.POSTS)
        .select('id')
        .eq('id', postId)
        .single();

      if (postError || !post) {
        throw new Error('Post not found');
      }

      // If this is a reply, check if parent comment exists and is not already a reply
      if (parentId) {
        const { data: parentComment, error: parentError } = await supabase
          .from(TABLES.COMMENTS)
          .select('id, parent_id')
          .eq('id', parentId)
          .single();

        if (parentError || !parentComment) {
          throw new Error('Parent comment not found');
        }

        if (parentComment.parent_id) {
          throw new Error('Cannot reply to a reply (max 2 levels of nesting)');
        }
      }

      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .insert([{
          content: content.trim(),
          post_id: postId,
          user_id: userId,
          parent_id: parentId || null
        }])
        .select(`
          *,
          user:users(id, name, username, image_url)
        `)
        .single();

      if (error) {
        console.error('❌ Error creating comment:', error);
        throw new Error(`Failed to create comment: ${error.message}`);
      }

      console.log('✅ Comment created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('❌ createComment error:', error);
      throw error;
    }
  }

  // ============================== GET COMMENTS BY POST
  export async function getCommentsByPost(postId: string) {
    try {
      console.log('🚀 Getting comments for post:', postId);

      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .select(`
          *,
          user:users(id, name, username, image_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error getting comments:', error);
        throw new Error(`Failed to get comments: ${error.message}`);
      }

      // Organize comments into a tree structure
      const commentsMap = new Map();
      const rootComments: any[] = [];

      // First pass: create all comment objects
      data.forEach(comment => {
        commentsMap.set(comment.id, {
          ...comment,
          replies: []
        });
      });

      // Second pass: organize into tree structure
      data.forEach(comment => {
        const commentObj = commentsMap.get(comment.id);
        if (comment.parent_id) {
          // This is a reply
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(commentObj);
          }
        } else {
          // This is a root comment
          rootComments.push(commentObj);
        }
      });

      console.log('✅ Comments retrieved successfully:', rootComments.length, 'root comments');
      return rootComments;
    } catch (error) {
      console.error('❌ getCommentsByPost error:', error);
      throw error;
    }
  }

  // ============================== UPDATE COMMENT
  export async function updateComment({ commentId, content }: IUpdateComment) {
    try {
      console.log('🚀 Updating comment:', commentId);

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Comment content cannot be empty');
      }

      if (content.length > 500) {
        throw new Error('Comment cannot exceed 500 characters');
      }

      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
          is_edited: true
        })
        .eq('id', commentId)
        .select(`
          *,
          user:users(id, name, username, image_url)
        `)
        .single();

      if (error) {
        console.error('❌ Error updating comment:', error);
        throw new Error(`Failed to update comment: ${error.message}`);
      }

      console.log('✅ Comment updated successfully');
      return data;
    } catch (error) {
      console.error('❌ updateComment error:', error);
      throw error;
    }
  }

  // ============================== DELETE COMMENT
  export async function deleteComment(commentId: string) {
    try {
      console.log('🚀 Deleting comment:', commentId);

      // First, delete all replies to this comment
      const { error: repliesError } = await supabase
        .from(TABLES.COMMENTS)
        .delete()
        .eq('parent_id', commentId);

      if (repliesError) {
        console.error('❌ Error deleting replies:', repliesError);
        throw new Error(`Failed to delete comment replies: ${repliesError.message}`);
      }

      // Then delete the comment itself
      const { error } = await supabase
        .from(TABLES.COMMENTS)
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('❌ Error deleting comment:', error);
        throw new Error(`Failed to delete comment: ${error.message}`);
      }

      console.log('✅ Comment and replies deleted successfully');
      return { status: 'ok' };
    } catch (error) {
      console.error('❌ deleteComment error:', error);
      throw error;
    }
  }

// ============================== LIKE/UNLIKE COMMENT (FIXED)
export async function likeComment(commentId: string, likesArray: string[]) {
  try {
    console.log('🚀 Updating comment likes:', { commentId, likesArray });

    // Ensure likesArray is valid
    if (!Array.isArray(likesArray)) {
      console.error('❌ likesArray must be an array:', likesArray);
      throw new Error('Invalid likes array format');
    }

    // First, update the comment likes
    const { error: updateError } = await supabase
      .from(TABLES.COMMENTS)
      .update({ 
        likes: likesArray,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (updateError) {
      console.error('❌ Error updating comment likes:', updateError);
      throw new Error(`Failed to update comment likes: ${updateError.message}`);
    }

    // Then, fetch the updated comment
    const { data, error: fetchError } = await supabase
      .from(TABLES.COMMENTS)
      .select(`
        *,
        user:users(id, name, username, image_url)
      `)
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching updated comment:', fetchError);
      throw new Error(`Failed to fetch updated comment: ${fetchError.message}`);
    }

    console.log('✅ Comment likes updated successfully:', {
      commentId,
      newLikesCount: likesArray.length
    });
    
    return data;
  } catch (error) {
    console.error('❌ likeComment error:', error);
    throw error;
  }
}

  // ============================== GET COMMENT COUNT
  export async function getCommentCount(postId: string) {
    try {
      const { count, error } = await supabase
        .from(TABLES.COMMENTS)
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        console.error('❌ Error getting comment count:', error);
        throw new Error(`Failed to get comment count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('❌ getCommentCount error:', error);
      throw error;
    }
  }

 // ============================================================
// MARKETPLACE
// ============================================================

// ============================== CREATE MARKETPLACE ITEM
export async function createMarketplaceItem(item: INewMarketplaceItem) {
  try {
    console.log('🛍️ Creating marketplace item:', item);

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('✅ User authenticated:', user.id);

    // Get the database user record using the auth user's account_id
    const { data: dbUser, error: dbUserError } = await supabase
      .from(TABLES.USERS)
      .select('id, account_id')
      .eq('account_id', user.id)
      .single();

    if (dbUserError || !dbUser) {
      console.error('❌ Database user lookup error:', dbUserError);
      throw new Error('User profile not found in database');
    }

    console.log('✅ Database user found:', { dbUserId: dbUser.id, authUserId: user.id });

    let imageUrls: string[] = [];
    let imagePaths: string[] = [];

    // Upload images if provided
    if (item.images && item.images.length > 0) {
      console.log('📷 Uploading marketplace images...');
      
      for (let i = 0; i < item.images.length; i++) {
        const file = item.images[i];
        const uploadedFile = await uploadFile(file);
        if (!uploadedFile) throw new Error(`Failed to upload image ${i + 1}`);

        const fileUrl = getFilePreview(uploadedFile.path);
        if (!fileUrl) {
          await deleteFile(uploadedFile.path);
          throw new Error(`Failed to get URL for image ${i + 1}`);
        }

        imageUrls.push(fileUrl);
        imagePaths.push(uploadedFile.path);
      }
    }

    console.log('💾 Inserting marketplace item into database...');

    // Create marketplace item with all required fields
    const insertData = {
      seller_id: dbUser.id, // Use the database user ID (not the auth user ID)
      title: item.title,
      description: item.description,
      price: item.price,
      condition: item.condition,
      location: item.location,
      images: imageUrls,
      status: 'active',
      contact_preferences: 'message', // Default value
      phone_number: null,
      views_count: 0,
      negotiable: false,
      shipping_available: false,
      shipping_cost: 0,
      brand: null
      // Removed search_vector: null
    };

    console.log('📝 Insert data:', insertData);

    const { data, error } = await supabase
      .from(TABLES.MARKETPLACE_ITEMS)
      .insert(insertData)
      .select(`
        *,
        seller:users!marketplace_items_seller_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('❌ Database insert error:', error);
      // Clean up uploaded images on error
      for (const path of imagePaths) {
        await deleteFile(path);
      }
      throw error;
    }

    console.log('✅ Marketplace item created successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ createMarketplaceItem error:', error);
    throw error;
  }
}

// ============================== GET MARKETPLACE ITEMS
export async function getMarketplaceItems(params?: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  limit?: number;
  offset?: number;
}) {
  try {
    console.log('🛍️ Fetching marketplace items with params:', params);

    let query = supabase
      .from(TABLES.MARKETPLACE_ITEMS)
      .select(`
        *,
        seller:users!marketplace_items_seller_id_fkey(*)
      `)
      .eq('status', 'active');

    // Apply filters
    if (params?.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    if (params?.minPrice !== undefined) {
      query = query.gte('price', params.minPrice);
    }

    if (params?.maxPrice !== undefined) {
      query = query.lte('price', params.maxPrice);
    }

    if (params?.condition) {
      query = query.eq('condition', params.condition);
    }

    if (params?.location) {
      query = query.ilike('location', `%${params.location}%`);
    }

    // Apply sorting
    switch (params?.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ getMarketplaceItems error:', error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} marketplace items`);
    return data || [];
  } catch (error) {
    console.error('❌ getMarketplaceItems error:', error);
    throw error;
  }
}

// ============================== GET MARKETPLACE ITEM BY ID
export async function getMarketplaceItemById(itemId: string) {
  try {
    console.log('🛍️ Fetching marketplace item:', itemId);

    const { data, error } = await supabase
      .from(TABLES.MARKETPLACE_ITEMS)
      .select(`
        *,
        seller:users!marketplace_items_seller_id_fkey(*)
      `)
      .eq('id', itemId)
      .single();

    if (error) {
      console.error('❌ getMarketplaceItemById error:', error);
      throw error;
    }

    console.log('✅ Fetched marketplace item:', data?.title);
    return data;
  } catch (error) {
    console.error('❌ getMarketplaceItemById error:', error);
    throw error;
  }
}

// ============================== GET USER'S MARKETPLACE ITEMS
export async function getUserMarketplaceItems(userId: string, status?: 'active' | 'sold' | 'expired') {
  try {
    console.log('🛍️ Fetching user marketplace items:', userId);

    let query = supabase
      .from(TABLES.MARKETPLACE_ITEMS)
      .select(`
        *,
        seller:users!marketplace_items_seller_id_fkey(*)
      `)
      .eq('seller_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ getUserMarketplaceItems error:', error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} user marketplace items`);
    return data || [];
  } catch (error) {
    console.error('❌ getUserMarketplaceItems error:', error);
    throw error;
  }
}

// ============================== UPDATE MARKETPLACE ITEM (FIXED)
export async function updateMarketplaceItem(item: IUpdateMarketplaceItem) {
  try {
    console.log('🛍️ Updating marketplace item:', item.itemId);
    console.log('🔍 Existing images to preserve:', item.images);
    console.log('🔍 New images to upload:', item.newImages?.length || 0);

    let finalImageUrls = item.images || []; // Start with existing images

    // Upload new images if provided
    if (item.newImages && item.newImages.length > 0) {
      console.log('📷 Uploading new marketplace images...');
      
      for (let i = 0; i < item.newImages.length; i++) {
        const file = item.newImages[i];
        const uploadedFile = await uploadFile(file);
        if (!uploadedFile) throw new Error(`Failed to upload image ${i + 1}`);

        const fileUrl = getFilePreview(uploadedFile.path);
        if (!fileUrl) {
          await deleteFile(uploadedFile.path);
          throw new Error(`Failed to get URL for image ${i + 1}`);
        }

        finalImageUrls.push(fileUrl);
      }
    }

    const updateData = {
      title: item.title,
      description: item.description,
      price: item.price,
      condition: item.condition,
      location: item.location,
      images: finalImageUrls, // Combined existing + new images
      updated_at: new Date().toISOString()
    };

    console.log('📝 Final update data:', {
      ...updateData,
      images: `${finalImageUrls.length} total images`
    });

    const { data, error } = await supabase
      .from(TABLES.MARKETPLACE_ITEMS)
      .update(updateData)
      .eq('id', item.itemId)
      .select(`
        *,
        seller:users!marketplace_items_seller_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('❌ updateMarketplaceItem error:', error);
      throw error;
    }

    console.log('✅ Marketplace item updated successfully');
    return data;
  } catch (error) {
    console.error('❌ updateMarketplaceItem error:', error);
    throw error;
  }
}

// ============================== DELETE MARKETPLACE ITEM (UPDATED)
export async function deleteMarketplaceItem(itemId: string, imagePaths?: string[]) {
  try {
    console.log('🛍️ Deleting marketplace item:', itemId);

    // Since we don't store image_paths anymore, we need to get the item first
    // to extract file paths from the URLs for deletion
    const { data: item, error: fetchError } = await supabase
      .from(TABLES.MARKETPLACE_ITEMS)
      .select('images')
      .eq('id', itemId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching item for deletion:', fetchError);
    }

    // Delete images from storage if they exist
    if (item?.images && item.images.length > 0) {
      console.log('🗑️ Deleting marketplace item images...');
      for (const imageUrl of item.images) {
        try {
          // Extract file path from URL
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await deleteFile(fileName);
        } catch (imageError) {
          console.error('❌ Error deleting image:', imageError);
          // Continue with other images even if one fails
        }
      }
    }

    const { error } = await supabase
      .from(TABLES.MARKETPLACE_ITEMS)
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('❌ deleteMarketplaceItem error:', error);
      throw error;
    }

    console.log('✅ Marketplace item deleted successfully');
    return { status: 'ok' };
  } catch (error) {
    console.error('❌ deleteMarketplaceItem error:', error);  
    throw error;
  }
}

// ============================== TOGGLE MARKETPLACE FAVORITE
export async function toggleMarketplaceFavorite(userId: string, itemId: string) {
  try {
    console.log('🛍️ Toggling marketplace favorite:', { userId, itemId });

    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from(TABLES.MARKETPLACE_FAVORITES)
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from(TABLES.MARKETPLACE_FAVORITES)
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);

      if (error) throw error;

      console.log('✅ Removed marketplace favorite');
      return { favorited: false };
    } else {
      // Add favorite
      const { error } = await supabase
        .from(TABLES.MARKETPLACE_FAVORITES)
        .insert({
          user_id: userId,
          item_id: itemId
        });

      if (error) throw error;

      console.log('✅ Added marketplace favorite');
      return { favorited: true };
    }
  } catch (error) {
    console.error('❌ toggleMarketplaceFavorite error:', error);
    throw error;
  }
}

// ============================== GET USER'S MARKETPLACE FAVORITES (UPDATED - NO CATEGORIES)
export async function getUserMarketplaceFavorites(userId: string) {
  try {
    console.log('🛍️ Fetching user marketplace favorites:', userId);

    const { data, error } = await supabase
      .from(TABLES.MARKETPLACE_FAVORITES)
      .select(`
        *,
        item:marketplace_items!marketplace_favorites_item_id_fkey(
          *,
          seller:users!marketplace_items_seller_id_fkey(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ getUserMarketplaceFavorites error:', error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} marketplace favorites`);
    return data || [];
  } catch (error) {
    console.error('❌ getUserMarketplaceFavorites error:', error);
    throw error;
  }
}

// ============================== CHECK IF ITEM IS FAVORITED
export async function isMarketplaceItemFavorited(userId: string, itemId: string) {
  try {
    const { data, error } = await supabase
      .from(TABLES.MARKETPLACE_FAVORITES)
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('❌ isMarketplaceItemFavorited error:', error);
    return false;
  }
}

// ============================== MARK ITEM AS SOLD
export async function markItemAsSold(itemId: string, userId: string) {
  try {
    console.log('🛍️ Marking item as sold:', itemId);

    const { data, error } = await supabase
      .from(TABLES.MARKETPLACE_ITEMS)
      .update({
        status: 'sold',
        sold_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('seller_id', userId) // Ensure only seller can mark as sold
      .select()
      .single();

    if (error) {
      console.error('❌ markItemAsSold error:', error);
      throw error;
    }

    console.log('✅ Item marked as sold');
    return data;
  } catch (error) {
    console.error('❌ markItemAsSold error:', error);
    throw error;
  }
}
// ============================== MARK ITEM AS ACTIVE
export async function markItemAsActive(itemId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from("marketplace_items")
      .update({ 
        status: "active",
        updated_at: new Date().toISOString()
      })
      .eq("id", itemId)
      .eq("seller_id", userId) // Ensure only owner can reactivate
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error marking item as active:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to mark item as active");
  }
}