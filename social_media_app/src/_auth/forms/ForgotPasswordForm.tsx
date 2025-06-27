import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useState } from "react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";

import { ForgotPasswordValidation } from "@/lib/validation";
import { useForgotPassword } from "@/lib/react-query/queries";

const ForgotPasswordForm = () => {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  // Query
  const { mutateAsync: forgotPassword, isLoading } = useForgotPassword();

  const form = useForm<z.infer<typeof ForgotPasswordValidation>>({
    resolver: zodResolver(ForgotPasswordValidation),
    defaultValues: {
      email: "",
    },
  });

  const handleForgotPassword = async (user: z.infer<typeof ForgotPasswordValidation>) => {
    try {
      await forgotPassword(user.email);
      
      setEmailSent(true);
      toast({ 
        title: "Reset email sent!", 
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      
      let errorMessage = "Failed to send reset email.";
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('rate limit') || 
            error.message.includes('Too Many Requests') ||
            error.message.includes('email rate limit exceeded')) {
          errorMessage = "Too many requests. Please wait 10-15 minutes before trying again.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes('User not found')) {
          // For security, we still show success even if user doesn't exist
          setEmailSent(true);
          toast({ 
            title: "Reset email sent!", 
            description: "If an account with that email exists, you'll receive reset instructions.",
          });
          return;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ 
        title: "Reset failed", 
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  if (emailSent) {
    return (
      <Form {...form}>
        <div className="sm:w-420 flex-center flex-col">
          {/* Wita Logo with Fish */}
          <div className="flex items-center gap-3 mb-6">
            {/* Fish Icon */}
            <div className="relative">
              <img src="/assets/icons/fish_122861.svg" alt="Wita Fish Logo" className="w-12 h-12" />
            </div>
            
            {/* Wita Text */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-white">Wita</h1>
            </div>
          </div>

          <div className="text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-green-500">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h2 className="h3-bold md:h2-bold pt-2 mb-2">
              Check your email
            </h2>
            <p className="text-light-3 small-medium md:base-regular mb-6">
              We've sent password reset instructions to <span className="text-primary-500">{form.getValues("email")}</span>
            </p>

            <div className="bg-dark-4/50 rounded-lg p-4 mb-6">
              <p className="text-light-3 text-sm">
                📧 Check your inbox and spam folder<br/>
                🔗 Click the reset link in the email<br/>
                ⏰ The link expires in 1 hour
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <Button 
                onClick={() => setEmailSent(false)}
                className="shad-button_primary"
              >
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Try another email
                </span>
              </Button>

              <Link
                to="/sign-in"
                className="text-primary-500 text-small-semibold hover:text-primary-400 transition-colors text-center"
              >
                Back to sign in
              </Link>
            </div>

            {/* Footer tagline */}
            <p className="text-xs text-light-4 text-center mt-6 opacity-70">
              🐟 Swimming together in the digital ocean
            </p>
          </div>
        </div>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        {/* Wita Logo with Fish */}
        <div className="flex items-center gap-3 mb-6">
          {/* Fish Icon */}
          <div className="relative">
            <img src="/assets/icons/fish_122861.svg" alt="Wita Fish Logo" className="w-12 h-12" />
          </div>
          
          {/* Wita Text */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white">Wita</h1>
            <p className="text-xs text-primary-500 -mt-1">Connect & Share</p>
          </div>
        </div>

        <h2 className="h3-bold md:h2-bold pt-2">
          Reset your password
        </h2>
        
        <p className="text-light-3 small-medium md:base-regular mt-2 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form
          onSubmit={form.handleSubmit(handleForgotPassword)}
          className="flex flex-col gap-5 w-full mt-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    className="shad-input" 
                    placeholder="your.email@example.com"
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
                <Loader /> Sending reset link...
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Send reset link
              </span>
            )}
          </Button>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-dark-4"></div>
            <span className="text-light-3 text-sm">or</span>
            <div className="flex-1 h-px bg-dark-4"></div>
          </div>

          <p className="text-small-regular text-light-2 text-center">
            Remember your password?
            <Link
              to="/sign-in"
              className="text-primary-500 text-small-semibold ml-1 hover:text-primary-400 transition-colors"
            >
              Back to sign in
            </Link>
          </p>

          {/* Footer tagline */}
          <p className="text-xs text-light-4 text-center mt-4 opacity-70">
            🐟 Swimming together in the digital ocean
          </p>
        </form>
      </div>
    </Form>
  );
};

export default ForgotPasswordForm;