import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";

import { SigninValidation } from "@/lib/validation";
import { useSignInAccount } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const SigninForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  // Query
  const { mutateAsync: signInAccount, isLoading } = useSignInAccount();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignin = async (user: z.infer<typeof SigninValidation>) => {
    try {
      const session = await signInAccount(user);

      if (!session) {
        toast({ 
          title: "Login failed", 
          description: "Invalid email or password. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        toast({ 
          title: "Welcome back to Hwita!", 
          description: "You have been signed in successfully.",
        });
        navigate("/");
      } else {
        toast({ 
          title: "Authentication failed", 
          description: "Please try signing in again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ 
        title: "Sign in failed", 
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        {/* Wita Logo with Fish */}
        <div className="flex items-center gap-3 mb-6">
          {/* Fish Icon */}
          <div className="relative">
            <img src="/assets/icons/fish_122861.svg" alt="Hwita Fish Logo" className="w-12 h-12" />
          </div>
          
          {/* Hwita Text */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white">Wita</h1>
            <p className="text-xs text-primary-500 -mt-1">Connect & Share</p>
          </div>
        </div>

        <h2 className="h3-bold md:h2-bold pt-2">
          Welcome back to Hwita
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          Dive back into your social ocean!
        </p>

        <form
          onSubmit={form.handleSubmit(handleSignin)}
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    className="shad-input" 
                    placeholder="Enter your password"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-primary-500 text-small-regular hover:underline hover:text-primary-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="shad-button_primary" disabled={isLoading || isUserLoading}>
            {isLoading || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Signing in...
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                  <path d="M15 3h6v6M9 21L21 9M21 3L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Dive In
              </span>
            )}
          </Button>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-dark-4"></div>
            <span className="text-light-3 text-sm">or</span>
            <div className="flex-1 h-px bg-dark-4"></div>
          </div>

          <p className="text-small-regular text-light-2 text-center">
            New to Hwita?
            <Link
              to="/sign-up"
              className="text-primary-500 text-small-semibold ml-1 hover:text-primary-400 transition-colors"
            >
              Join the school of fish
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

export default SigninForm;