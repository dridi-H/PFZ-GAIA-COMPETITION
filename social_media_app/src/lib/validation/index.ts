import * as z from "zod";

// ============================================================
// USER
// ============================================================
export const SignupValidation = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must be less than 50 characters." }),
  username: z.string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(20, { message: "Username must be less than 20 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }),
  email: z.string()
    .email({ message: "Please enter a valid email address." })
    .min(5, { message: "Email must be at least 5 characters." })
    .max(100, { message: "Email must be less than 100 characters." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(100, { message: "Password must be less than 100 characters." })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: "Password must contain at least one uppercase letter, one lowercase letter, and one number." }),
});

export const SigninValidation = z.object({
  email: z.string()
    .email({ message: "Please enter a valid email address." })
    .min(5, { message: "Email must be at least 5 characters." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

export const ForgotPasswordValidation = z.object({
  email: z.string()
    .email({ message: "Please enter a valid email address." })
    .min(5, { message: "Email must be at least 5 characters." })
    .max(100, { message: "Email must be less than 100 characters." }),
});

export const ProfileValidation = z.object({
  file: z.custom<File[]>(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
  bio: z.string(),
});

// ============================================================
// POST
// ============================================================
export const PostValidation = z.object({
  caption: z.string().max(2200, { message: "Maximum 2,200 characters" }),
  file: z.custom<File[]>().optional(),
  location: z.string().optional(),
  tags: z.string().optional(),
}).refine(
  (data) => {
    // Must have either caption or file (or both)
    const hasCaption = data.caption && data.caption.trim().length > 0;
    const hasFile = data.file && data.file.length > 0;
    return hasCaption || hasFile;
  },
  {
    message: "Please add either text content or an image for your post",
    path: ["caption"], // This will show the error on the caption field
  }
);
