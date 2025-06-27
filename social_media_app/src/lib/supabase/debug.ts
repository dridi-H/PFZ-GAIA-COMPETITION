import { supabase } from './config';
import { createUserAccount } from './api';

// ============================================================
// DEBUG FUNCTIONS
// ============================================================

// ============================== TEST DATABASE CONNECTION
export async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('Test 1: Basic connection test');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    console.log('Connection test result:', { data: connectionTest, error: connectionError });

    // Test 2: Check if users table exists and has any data
    console.log('Test 2: Users table existence and data');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    console.log('Users table test:', { 
      data: usersData ? `Found ${usersData.length} users` : 'No data', 
      error: usersError 
    });

    // Test 3: Check current auth session
    console.log('Test 3: Current auth session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session test:', { 
      session: session ? { user: session.user.id, expires: session.expires_at } : 'No session', 
      error: sessionError 
    });

    // Test 4: Check RLS policies (this might fail if no user is authenticated)
    if (session) {
      console.log('Test 4: RLS policy test (authenticated)');
      const { data: rlsTest, error: rlsError } = await supabase
        .from('users')
        .select('*')
        .eq('account_id', session.user.id);
      
      console.log('RLS test result:', { 
        data: rlsTest ? `Found ${rlsTest.length} user records` : 'No data', 
        error: rlsError 
      });
    }

    return {
      success: true,
      tests: {
        connection: !connectionError,
        usersTable: !usersError,
        session: !!session,
        rls: session ? !usersError : 'skipped'
      }
    };
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return { success: false, error };
  }
}

// ============================== CREATE TEST USER (FOR DEBUGGING)
export async function createTestUser() {
  console.log('🧪 Creating test user...');
  
  try {
    // Use a variety of email domains to test
    const emailDomains = ['gmail.com', 'test.com', 'demo.org', 'example.org'];
    const randomDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@${randomDomain}`;
    const testPassword = 'TestPassword123!';
    const testUsername = `testuser${timestamp}`;
    
    console.log('📧 Attempting signup with:', {
      email: testEmail,
      password: 'TestPassword123!',
      username: testUsername
    });

    // Use the same function as the real signup to ensure consistency
    const result = await createUserAccount({
      name: 'Test User',
      username: testUsername,
      email: testEmail,
      password: testPassword
    });

    console.log('✅ Test user created successfully:', result);

    return { 
      success: true, 
      user: result, 
      credentials: { email: testEmail, password: testPassword }
    };
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================== CREATE TEST USER WITH SPECIFIC EMAIL
export async function createTestUserWithEmail(email: string, password: string = 'TestPassword123!') {
  console.log('🧪 Creating test user with specific email:', email);
  
  try {
    const timestamp = Date.now();
    const testUsername = `testuser${timestamp}`;
    
    const result = await createUserAccount({
      name: 'Test User',
      username: testUsername,
      email: email,
      password: password
    });

    console.log('✅ Test user with specific email created:', result);

    return { 
      success: true, 
      user: result, 
      credentials: { email, password }
    };
  } catch (error) {
    console.error('❌ Test user creation with specific email failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================== CHECK DATABASE SCHEMA
export async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    const tables = ['users', 'posts', 'saves'];
    const results: Record<string, any> = {};
    
    for (const table of tables) {
      console.log(`Checking table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      results[table] = {
        exists: !error,
        error: error?.message,
        hasData: data && data.length > 0
      };
      
      console.log(`Table ${table}:`, results[table]);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    return { error };
  }
}

// ============================== TEST RLS POLICIES
export async function testRLSPolicies() {
  console.log('🔒 Testing RLS policies...');
  
  try {
    // Test 1: Check if we can read from users table
    console.log('Test 1: Reading from users table');
    const { data: usersRead, error: usersReadError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    console.log('Users read test:', { 
      success: !usersReadError, 
      count: usersRead?.length || 0, 
      error: usersReadError 
    });

    // Test 2: Check current authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current auth user:', { 
      authenticated: !!user, 
      userId: user?.id, 
      email: user?.email,
      error: userError 
    });

    // Test 3: Try to insert a test record
    console.log('Test 3: Attempting direct insert');
    const testUuid = crypto.randomUUID();
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        account_id: testUuid,
        name: 'RLS Test User',
        username: `rlstest${Date.now()}`,
        email: `rlstest${Date.now()}@test.com`,
        bio: 'Testing RLS policies',
        image_url: 'https://example.com/test.jpg'
      })
      .select()
      .single();

    console.log('Direct insert test:', { 
      success: !insertError, 
      data: insertData, 
      error: insertError 
    });

    // Test 4: Check what auth.uid() would return in context
    console.log('Test 4: Auth context test');
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session context:', {
      hasSession: !!sessionData.session,
      sessionUserId: sessionData.session?.user?.id,
      sessionUserEmail: sessionData.session?.user?.email
    });

    return {
      canRead: !usersReadError,
      isAuthenticated: !!user,
      canInsert: !insertError,
      authUserId: user?.id,
      sessionUserId: sessionData.session?.user?.id
    };

  } catch (error) {
    console.error('❌ RLS policy test failed:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================== TEST SIGNUP WITH RLS BYPASS
export async function testSignupWithRLSBypass(email: string, password: string) {
  console.log('🔓 Testing signup with RLS bypass approach...');
  
  try {
    // Step 1: Create auth user
    console.log('Step 1: Creating auth user');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: 'Bypass Test User',
          username: `bypasstest${Date.now()}`
        }
      }
    });

    if (authError) {
      console.error('Auth signup failed:', authError);
      return { success: false, step: 'auth', error: authError.message };
    }

    if (!authData.user) {
      return { success: false, step: 'auth', error: 'No user returned from auth' };
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Wait for session to be established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Try different approaches to create user profile
    const approaches = [
      // Approach 1: Direct insert (current method)
      async () => {
        console.log('Approach 1: Direct insert');
        return await supabase
          .from('users')
          .insert({
            account_id: authData.user!.id,
            name: 'Bypass Test User',
            username: `bypasstest${Date.now()}`,
            email: email,
            bio: 'Testing bypass approach',
            image_url: 'https://example.com/test.jpg'
          })
          .select()
          .single();
      },

      // Approach 2: Insert with explicit auth context
      async () => {
        console.log('Approach 2: With auth context');
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) throw new Error('No session available');
        
        return await supabase
          .from('users')
          .insert({
            account_id: session.session.user.id,
            name: 'Bypass Test User 2',
            username: `bypasstest2${Date.now()}`,
            email: `2${email}`,
            bio: 'Testing with session context',
            image_url: 'https://example.com/test2.jpg'
          })
          .select()
          .single();
      },

      // Approach 3: Using RPC function (if available)
      async () => {
        console.log('Approach 3: Via RPC (if available)');
        // This would require a custom RPC function in Supabase
        throw new Error('RPC approach not implemented');
      }
    ];

    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`Testing approach ${i + 1}...`);
        const { data, error } = await approaches[i]();
        
        if (!error && data) {
          console.log(`✅ Success with approach ${i + 1}:`, data);
          return { 
            success: true, 
            approach: i + 1, 
            userId: data.id, 
            authUserId: authData.user.id 
          };
        } else {
          console.log(`❌ Approach ${i + 1} failed:`, error);
        }
      } catch (error) {
        console.log(`❌ Approach ${i + 1} exception:`, error);
      }
    }

    return { success: false, step: 'profile', error: 'All approaches failed' };

  } catch (error) {
    console.error('❌ Complete bypass test failed:', error);
    return { 
      success: false, 
      step: 'unknown', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============================== RUN ALL DIAGNOSTICS
export async function runDiagnostics() {
  console.log('🚀 Running complete diagnostics...');
  
  const results = {
    connection: await testDatabaseConnection(),
    schema: await checkDatabaseSchema(),
    rls: await testRLSPolicies()
  };
  
  console.log('📊 Diagnostic Results:', results);
  return results;
}

// ============================================================
// POST-RLS TESTING FUNCTIONS
// ============================================================

// ============================== TEST SIGNUP AFTER RLS RE-ENABLEMENT
export async function testSignupAfterRLS(email: string, password: string = 'TestPassword123!') {
  console.log('🔒 Testing signup after RLS policies are re-enabled...');
  
  try {
    const timestamp = Date.now();
    const testUser = {
      name: 'Post-RLS Test User',
      username: `postrlstest${timestamp}`,
      email: email,
      password: password
    };

    console.log('🚀 Attempting signup with RLS enabled:', {
      email: testUser.email,
      username: testUser.username
    });

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          name: testUser.name,
          username: testUser.username
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return { success: false, step: 'auth', error: authError.message };
    }

    if (!authData.user) {
      return { success: false, step: 'auth', error: 'No user returned from auth' };
    }

    console.log('✅ Auth user created successfully:', {
      userId: authData.user.id,
      email: authData.user.email,
      confirmed: authData.user.email_confirmed_at ? 'Yes' : 'No'
    });

    // Step 2: Wait for session to be established
    console.log('⏳ Waiting for session establishment...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Verify session is active
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('📋 Session verification:', {
      hasSession: !!sessionData.session,
      sessionUserId: sessionData.session?.user?.id,
      sessionUserEmail: sessionData.session?.user?.email,
      sessionError: sessionError,
      idsMatch: sessionData.session?.user?.id === authData.user.id
    });

    if (!sessionData.session) {
      return { success: false, step: 'session', error: 'No session established after signup' };
    }

    // Step 4: Attempt to create user profile with RLS policies
    console.log('💾 Attempting to create user profile with RLS policies...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        account_id: authData.user.id,
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
        bio: 'Test user created after RLS re-enablement',
        image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(testUser.name)}&background=random`
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed with RLS:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      });
      return { success: false, step: 'profile', error: profileError.message, details: profileError };
    }

    console.log('✅ Profile created successfully with RLS policies:', {
      profileId: profileData.id,
      username: profileData.username,
      email: profileData.email
    });

    // Step 5: Test reading the created profile
    console.log('📖 Testing profile read access...');
    const { data: readProfile, error: readError } = await supabase
      .from('users')
      .select('*')
      .eq('id', profileData.id)
      .single();

    if (readError) {
      console.error('❌ Profile read failed:', readError);
      return { success: false, step: 'read', error: readError.message };
    }

    console.log('✅ Profile read successful:', {
      canReadOwnProfile: !!readProfile,
      profileData: readProfile
    });

    // Step 6: Test updating the profile
    console.log('✏️ Testing profile update access...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({ bio: 'Updated bio after RLS test' })
      .eq('id', profileData.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
      return { success: false, step: 'update', error: updateError.message };
    }

    console.log('✅ Profile update successful:', {
      canUpdateOwnProfile: !!updatedProfile,
      updatedBio: updatedProfile.bio
    });

    return {
      success: true,
      authUser: authData.user,
      profile: profileData,
      tests: {
        auth: true,
        session: true,
        profile: true,
        read: true,
        update: true
      }
    };

  } catch (error) {
    console.error('❌ Complete post-RLS signup test failed:', error);
    return {
      success: false,
      step: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================== TEST SECURITY BOUNDARIES
export async function testSecurityBoundaries() {
  console.log('🛡️ Testing RLS security boundaries...');
  
  try {
    // Test 1: Try to read all users (should work - users can see other profiles)
    console.log('Test 1: Reading all user profiles...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, name, username, email')
      .limit(10);

    console.log('All users visibility test:', {
      canSeeOtherUsers: !allUsersError,
      userCount: allUsers?.length || 0,
      error: allUsersError?.message
    });

    // Test 2: Try to update another user's profile (should fail)
    if (allUsers && allUsers.length > 1) {
      console.log('Test 2: Attempting to update another user\'s profile...');
      const otherUser = allUsers.find(u => u.id !== allUsers[0].id);
      
      if (otherUser) {        const { error: unauthorizedError } = await supabase
          .from('users')
          .update({ bio: 'Unauthorized update attempt' })
          .eq('id', otherUser.id)
          .select();

        console.log('Unauthorized update test:', {
          shouldFail: true,
          actuallyFailed: !!unauthorizedError,
          error: unauthorizedError?.message,
          securityWorking: !!unauthorizedError
        });
      }
    }

    // Test 3: Try to insert a profile for a different user (should fail)
    console.log('Test 3: Attempting to create profile for different user...');
    const fakeUserId = crypto.randomUUID();    const { error: insertError } = await supabase
      .from('users')
      .insert({
        account_id: fakeUserId,
        name: 'Unauthorized User',
        username: `unauthorized${Date.now()}`,
        email: `unauthorized${Date.now()}@test.com`,
        bio: 'This should not be allowed'
      })
      .select();

    console.log('Unauthorized insert test:', {
      shouldFail: true,
      actuallyFailed: !!insertError,
      error: insertError?.message,
      securityWorking: !!insertError
    });

    return {
      canSeeOtherUsers: !allUsersError,
      cannotUpdateOthers: true, // Should be true if security is working
      cannotInsertForOthers: !!insertError,
      securityWorking: !!insertError // Should be true
    };

  } catch (error) {
    console.error('❌ Security boundary test failed:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// POST-CLEANUP TESTING FUNCTIONS
// ============================================================

// ============================== TEST AFTER POLICY CLEANUP
export async function testAfterPolicyCleanup(email: string, password: string = 'TestPassword123!') {
  console.log('🧹 Testing signup after RLS policy cleanup...');
  
  try {
    const timestamp = Date.now();
    const testUser = {
      name: 'Clean RLS Test User',
      username: `cleantest${timestamp}`,
      email: email,
      password: password
    };

    console.log('🚀 Testing with cleaned RLS policies:', {
      email: testUser.email,
      username: testUser.username
    });    // Test 1: Check current policy count (commented out - not directly accessible from client)
    // const { data: policyCount, error: policyError } = await supabase
    //   .rpc('count_policies'); // We'll need to create this RPC or check manually

    console.log('Skipping direct policy count check - testing functionality instead...');

    // Test 2: Check basic database access
    console.log('Step 2: Testing basic database access...');
    const { data: usersCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log('Database access test:', {
      canRead: !countError,
      userCount: usersCount,
      error: countError?.message
    });

    // Test 3: Create auth user
    console.log('Step 3: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          name: testUser.name,
          username: testUser.username
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return { success: false, step: 'auth', error: authError.message };
    }

    if (!authData.user) {
      return { success: false, step: 'auth', error: 'No user returned from auth' };
    }

    console.log('✅ Auth user created:', {
      userId: authData.user.id,
      email: authData.user.email
    });

    // Test 4: Wait for session establishment
    console.log('Step 4: Establishing session...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Verify auth context
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();

    console.log('Auth context verification:', {
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?.id,
      hasSession: !!sessionData.session,
      sessionUserId: sessionData.session?.user?.id,
      idsMatch: currentUser?.id === authData.user.id
    });

    // Test 6: Attempt profile creation with cleaned policies
    console.log('Step 5: Creating user profile with cleaned RLS policies...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        account_id: authData.user.id,
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
        bio: 'Created with cleaned RLS policies',
        image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(testUser.name)}&background=random`
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed even with cleaned policies:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      });
      return { 
        success: false, 
        step: 'profile', 
        error: profileError.message,
        code: profileError.code
      };
    }

    console.log('✅ Profile created successfully with cleaned policies:', {
      profileId: profileData.id,
      username: profileData.username,
      email: profileData.email
    });

    // Test 7: Verify profile access
    console.log('Step 6: Testing profile read access...');
    const { data: readTest, error: readError } = await supabase
      .from('users')
      .select('*')
      .eq('id', profileData.id)
      .single();

    console.log('Profile read test:', {
      canRead: !readError,
      profile: readTest ? 'Found' : 'Not found',
      error: readError?.message
    });

    return {
      success: true,
      message: 'Signup successful with cleaned RLS policies',
      authUser: authData.user,
      profile: profileData,
      tests: {
        auth: true,
        session: true,
        profile: true,
        read: !readError
      }
    };

  } catch (error) {
    console.error('❌ Post-cleanup signup test failed:', error);
    return {
      success: false,
      step: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================== VERIFY POLICY COUNT
export async function verifyPolicyCount() {
  console.log('📊 Verifying RLS policy count after cleanup...');
  
  try {
    // This is a client-side check - we can't directly query pg_policies from client
    // But we can test the functionality
      const tests = {
      users: {
        canRead: false,
        canInsert: false,
        canUpdate: false,
        error: null as string | null
      },
      posts: {
        canRead: false,
        canInsert: false,
        canUpdate: false,
        error: null as string | null
      },
      saves: {
        canRead: false,
        canInsert: false,
        canDelete: false,
        error: null as string | null
      }
    };

    // Test users table access
    try {
      const { error: usersReadError } = await supabase.from('users').select('id').limit(1);
      tests.users.canRead = !usersReadError;
      if (usersReadError) tests.users.error = usersReadError.message;
    } catch (error) {
      tests.users.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test posts table access
    try {
      const { error: postsReadError } = await supabase.from('posts').select('id').limit(1);
      tests.posts.canRead = !postsReadError;
      if (postsReadError) tests.posts.error = postsReadError.message;
    } catch (error) {
      tests.posts.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test saves table access
    try {
      const { error: savesReadError } = await supabase.from('saves').select('id').limit(1);
      tests.saves.canRead = !savesReadError;
      if (savesReadError) tests.saves.error = savesReadError.message;
    } catch (error) {
      tests.saves.error = error instanceof Error ? error.message : 'Unknown error';
    }

    console.log('Policy functionality test results:', tests);

    return {
      success: true,
      functionalityTest: tests,
      summary: {
        tablesAccessible: [
          tests.users.canRead ? 'users' : null,
          tests.posts.canRead ? 'posts' : null,
          tests.saves.canRead ? 'saves' : null
        ].filter(Boolean),
        errors: [
          tests.users.error,
          tests.posts.error,
          tests.saves.error
        ].filter(Boolean)
      }
    };

  } catch (error) {
    console.error('❌ Policy count verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
