import * as z from "zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";

import { useCreateUserAccount, useSignInAccount } from "@/lib/react-query/queries";
import { SignupValidation } from "@/lib/validation";
import { useUserContext } from "@/context/AuthContext";

const SignupForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  // Queries
  const { mutateAsync: createUserAccount, isLoading: isCreatingAccount } = useCreateUserAccount();
  const { mutateAsync: signInAccount, isLoading: isSigningInUser } = useSignInAccount();

  // Handler
  const handleSignup = async (user: z.infer<typeof SignupValidation>) => {
    try {
      // Additional client-side validation before sending to server
      if (!user.email.includes('@') || !user.email.includes('.')) {
        toast({ 
          title: "Invalid email", 
          description: "Please enter a valid email address (e.g., user@gmail.com)",
          variant: "destructive"
        });
        return;
      }

      if (user.password.length < 8) {
        toast({ 
          title: "Password too short", 
          description: "Password must be at least 8 characters long",
          variant: "destructive"
        });
        return;
      }

      // Show loading state
      toast({ 
        title: "Creating your Wita account...", 
        description: "Please wait while we set up your profile",
      });
      
      const newUser = await createUserAccount(user);

      if (!newUser) {
        toast({ 
          title: "Sign up failed", 
          description: "Could not create your account. Please check your email and try again.",
          variant: "destructive"
        });
        return;
      }

      const session = await signInAccount({
        email: user.email,
        password: user.password,
      });

      if (!session) {
        toast({ 
          title: "Account created successfully!", 
          description: "Please sign in with your new Wita account.",
        });
        navigate("/sign-in");
        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        toast({ 
          title: "Welcome to Wita!", 
          description: "Your account has been created successfully. Dive in!",
        });
        navigate("/");
      } else {
        toast({ 
          title: "Please sign in", 
          description: "Account created but please sign in manually.",
        });
        navigate("/sign-in");
      }
    } catch (error) {
      // Handle specific error types
      let errorMessage = "An unexpected error occurred.";
      let errorTitle = "Sign up failed";
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid email format')) {
          errorTitle = "Invalid Email";
          errorMessage = "Please use a valid email address like user@gmail.com";
        } else if (error.message.includes('password')) {
          errorTitle = "Password Error";
          errorMessage = error.message;
        } else if (error.message.includes('Username is reserved')) {
          errorTitle = "Username Unavailable";
          errorMessage = error.message;
        } else if (error.message.includes('Authentication failed')) {
          errorTitle = "Authentication Error";
          errorMessage = "There was a problem creating your account. Please try again with a different email.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ 
        title: errorTitle, 
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        
        <h2 className="h3-bold md:h2-bold pt-2">
          Join the Hwita community
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          Create your account and start swimming with friends!
        </p>

        <form
          onSubmit={form.handleSubmit(handleSignup)}
          className="flex flex-col gap-5 w-full mt-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Full Name</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    className="shad-input" 
                    placeholder="Enter your full name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Username</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    className="shad-input" 
                    placeholder="Choose a unique username"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    placeholder="Create a strong password (8+ characters)"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-xs text-light-4 mt-2">
            <p>By signing up, you agree to swim responsibly in our digital ocean 🌊</p>
          </div>

          <Button 
            type="submit" 
            className="shad-button_primary" 
            disabled={isCreatingAccount || isSigningInUser || isUserLoading}
          >
            {isCreatingAccount || isSigningInUser || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Creating your account...
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="m19 8 2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="m21 10-7.5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Join the School
              </span>
            )}
          </Button>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-dark-4"></div>
            <span className="text-light-3 text-sm">or</span>
            <div className="flex-1 h-px bg-dark-4"></div>
          </div>

          <div className="text-small-regular text-light-2 text-center">
            Already swimming with us?
            <button
              type="button"
              onClick={() => navigate("/sign-in")}
              className="text-primary-500 text-small-semibold ml-1 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              Dive back in
            </button>
          </div>

          
        </form>
      </div>
    </Form>
  );
};

export default SignupForm;