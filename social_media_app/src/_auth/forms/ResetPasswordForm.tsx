import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";

import { supabase } from "@/lib/supabase/config";

const ResetPasswordValidation = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPasswordForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const form = useForm<z.infer<typeof ResetPasswordValidation>>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check if we have a valid reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.log('No valid reset session found');
          setIsValidSession(false);
          return;
        }

        // Check if this is a password reset session
        const accessToken = session.access_token;
        if (accessToken) {
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsValidSession(false);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async (values: z.infer<typeof ResetPasswordValidation>) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password updated!",
        description: "Your password has been successfully updated.",
      });

      // Navigate to sign in after successful reset
      setTimeout(() => {
        navigate("/sign-in");
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = "Failed to update password.";
      
      if (error instanceof Error) {
        if (error.message.includes('session_not_found')) {
          errorMessage = "Reset link has expired. Please request a new password reset.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Reset failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <div className="flex-center w-full h-screen">
        <Loader />
      </div>
    );
  }

  // Show error if no valid session
  if (isValidSession === false) {
    return (
      <div className="sm:w-420 flex-center flex-col">
        {/* Wita Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <img src="/assets/icons/fish_122861.svg" alt="Wita Fish Logo" className="w-12 h-12" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white">Wita</h1>
            <p className="text-xs text-primary-500 -mt-1">Connect & Share</p>
          </div>
        </div>

        <div className="text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-500">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>

          <h2 className="h3-bold md:h2-bold pt-2 mb-2">
            Invalid reset link
          </h2>
          <p className="text-light-3 small-medium md:base-regular mb-6">
            This password reset link has expired or is invalid. Please request a new one.
          </p>

          <div className="flex flex-col gap-4 w-full">
            <Link to="/forgot-password">
              <Button className="shad-button_primary w-full">
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Request new reset link
                </span>
              </Button>
            </Link>

            <Link
              to="/sign-in"
              className="text-primary-500 text-small-semibold hover:text-primary-400 transition-colors text-center"
            >
              Back to sign in
            </Link>
          </div>

          <p className="text-xs text-light-4 text-center mt-6 opacity-70">
            🐟 Swimming together in the digital ocean
          </p>
        </div>
      </div>
    );
  }

  // Show reset password form - Simple structure like ForgotPasswordForm
  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        {/* Wita Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <img src="/assets/icons/fish_122861.svg" alt="Wita Fish Logo" className="w-12 h-12" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white">Wita</h1>
            <p className="text-xs text-primary-500 -mt-1">Connect & Share</p>
          </div>
        </div>

        <h2 className="h3-bold md:h2-bold pt-2">
          Set new password
        </h2>
        
        <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
          Enter your new password below.
        </p>

        <form
          onSubmit={form.handleSubmit(handleResetPassword)}
          className="flex flex-col gap-5 w-full mt-6">
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">New Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    className="shad-input" 
                    placeholder="Enter your new password"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    className="shad-input" 
                    placeholder="Confirm your new password"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shad-button_primary" disabled={isLoading}>
            {isLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Updating password...
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Update password
              </span>
            )}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-4">
            <Link
              to="/sign-in"
              className="text-primary-500 text-small-semibold hover:text-primary-400 transition-colors"
            >
              Back to sign in
            </Link>
          </p>

          <p className="text-xs text-light-4 text-center mt-4 opacity-70">
            🐟 Swimming together in the digital ocean
          </p>
        </form>
      </div>
    </Form>
  );
};

export default ResetPasswordForm;