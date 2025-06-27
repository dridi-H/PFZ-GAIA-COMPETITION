import { useNavigate, useLocation } from "react-router-dom";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { IUser } from "@/types";
import { getCurrentUser } from "@/lib/supabase/api";
import { supabase } from "@/lib/supabase/config";

export const INITIAL_USER = {
  id: "",
  name: "",
  username: "",
  email: "",
  image_url: "",
  bio: "",
};

const INITIAL_STATE = {
  user: INITIAL_USER,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false as boolean,
};

type IContextType = {
  user: IUser;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use ref to track if we're already checking auth to prevent duplicate calls
  const isCheckingAuth = useRef(false);

  const checkAuthUser = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth.current) {
      console.log('🔍 AuthContext: Auth check already in progress, skipping...');
      return false;
    }

    console.log('🔍 AuthContext: Starting checkAuthUser...');
    isCheckingAuth.current = true;
    setIsLoading(true);
    
    try {
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 AuthContext: Session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        sessionError: sessionError 
      });

      if (!session || sessionError) {
        console.log('🔍 AuthContext: No valid session, user not authenticated');
        setUser(INITIAL_USER);
        setIsAuthenticated(false);
        return false;
      }

      // Now try to get the user profile
      console.log('🔍 AuthContext: Getting current user profile...');
      const currentAccount = await getCurrentUser();
      console.log('🔍 AuthContext: getCurrentUser result:', currentAccount ? 'Found user' : 'No user profile');

      if (currentAccount) {
        setUser({
          id: currentAccount.id,
          name: currentAccount.name,
          username: currentAccount.username,
          email: currentAccount.email,
          image_url: currentAccount.image_url,
          bio: currentAccount.bio,
        });
        setIsAuthenticated(true);
        console.log('✅ AuthContext: User authenticated successfully:', currentAccount.username);
        return true;
      } else {
        console.log('❌ AuthContext: User session exists but no profile found');
        setUser(INITIAL_USER);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: checkAuthUser error:', error);
      setUser(INITIAL_USER);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
      isCheckingAuth.current = false;
    }
  }, []);

  useEffect(() => {
    console.log('🚀 AuthContext: Initializing auth state...');
    
    let mounted = true;

    // Check for existing session on app start
    const initializeAuth = async () => {
      if (!mounted) return;
      
      console.log('🔍 AuthContext: Checking initial session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (error) {
        console.error('❌ AuthContext: Session error:', error);
        setIsLoading(false);
        return;
      }

      if (session) {
        console.log('✅ AuthContext: Found existing session, checking user profile...');
        await checkAuthUser();
      } else {
        console.log('ℹ️ AuthContext: No existing session');
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    console.log('🎧 AuthContext: Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        
        console.log('🔄 AuthContext: Auth state changed:', { event, hasSession: !!session });
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('👋 AuthContext: User signed out, clearing state');
          setUser(INITIAL_USER);
          setIsAuthenticated(false);
          setIsLoading(false);
          
          // Only navigate to sign-in if we're not already on an auth page
          const currentPath = location.pathname;
          const isOnAuthPage = currentPath === '/sign-in' || 
                              currentPath === '/sign-up' || 
                              currentPath === '/forgot-password' ||
                              currentPath === '/reset-password';
          
          if (!isOnAuthPage) {
            console.log('🔄 AuthContext: Navigating to sign-in from:', currentPath);
            navigate("/sign-in");
          } else {
            console.log('🔄 AuthContext: Already on auth page, not navigating');
          }        } else if (event === 'SIGNED_IN') {
          console.log('🔐 AuthContext: User signed in, checking profile...');
          
          // Check if we're on password reset or other auth pages - don't redirect from these
          const currentPath = location.pathname;
          const isOnAuthPage = currentPath === '/sign-in' || 
                              currentPath === '/sign-up' || 
                              currentPath === '/forgot-password' ||
                              currentPath === '/reset-password';
          
          if (isOnAuthPage) {
            console.log('🔐 AuthContext: On auth page, staying put and not checking profile');
            setUser(INITIAL_USER);
            setIsAuthenticated(false);
            setIsLoading(false);
            // Completely skip any profile checking or navigation
            return;
          } else {
            // Check if user is already authenticated to avoid unnecessary redirects
            // This prevents tab switching from causing redirects
            if (isAuthenticated) {
              console.log('🔐 AuthContext: User already authenticated, skipping redirect');
              return;
            }
            
            // Normal sign-in flow - user is on a protected page and not yet authenticated
            console.log('🔐 AuthContext: Normal sign in, checking profile...');
            setTimeout(async () => {
              if (mounted) {
                const wasAuthenticated = await checkAuthUser();
                // Only navigate to home if user was not authenticated before and is signing in for the first time
                // Don't navigate if they're already on a protected page and just had their session refreshed
                if (wasAuthenticated && currentPath.startsWith('/sign-')) {
                  navigate('/');
                }
              }
            }, 1000);
          }        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 AuthContext: Token refreshed, skipping unnecessary updates if already authenticated');
          // Only update if user is not already authenticated to avoid unnecessary state changes
          if (!isAuthenticated) {
            console.log('🔄 AuthContext: User not authenticated, checking profile after token refresh...');
            await checkAuthUser();
          } else {
            console.log('🔄 AuthContext: User already authenticated, token refresh handled silently');
          }
        }
      }
    );

    return () => {
      console.log('🧹 AuthContext: Cleaning up auth listener');
      mounted = false;
      isCheckingAuth.current = false;
      subscription.unsubscribe();
    };
  }, [checkAuthUser, navigate, location.pathname]);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUserContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within an AuthProvider');
  }
  return context;
};