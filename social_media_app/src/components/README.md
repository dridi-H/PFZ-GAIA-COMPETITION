# 🧩 Wita Component System

<div align="center">

![React](https://img.shields.io/badge/React-Components-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Type%20Safe-3178C6.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)
![Shadcn/ui](https://img.shields.io/badge/Shadcn-UI-000000.svg)

[🏠 Back to Frontend](../README.md) | [📱 Shared](#-shared-components) | [🎨 UI](#-ui-components) | [📝 Forms](#-form-components)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [📱 Shared Components](#-shared-components)
- [🎨 UI Components](#-ui-components)
- [📝 Form Components](#-form-components)
- [🎯 Component Guidelines](#-component-guidelines)
- [🚀 Usage Examples](#-usage-examples)
- [🔧 Customization](#-customization)

---

## 🌟 Overview

The Wita Component System is a comprehensive collection of reusable React components built with **TypeScript**, **Tailwind CSS**, and **Shadcn/ui**. It provides a consistent design language and user experience across the marine social platform.

### Key Features
- **🎨 Design System**: Consistent visual language and spacing
- **♿ Accessibility**: WCAG compliant components
- **📱 Responsive**: Mobile-first design approach
- **🔧 Customizable**: Easily themeable and extendable
- **⚡ Performance**: Optimized for speed and bundle size
- **🧩 Modular**: Composable and reusable components

---

## 🏗️ Architecture

```
src/components/
├── shared/                    # Shared application components
│   ├── Bottombar.tsx          # Mobile navigation bar
│   ├── FileUploader.tsx       # File upload component
│   ├── GridPostList.tsx       # Post grid display
│   ├── LeftSidebar.tsx        # Desktop sidebar navigation
│   ├── Loader.tsx             # Loading indicators
│   ├── PostCard.tsx           # Social media post card
│   ├── PostStats.tsx          # Post interaction stats
│   ├── ProfileUploader.tsx    # Profile picture uploader
│   ├── Topbar.tsx             # Header/navigation bar
│   ├── UserCard.tsx           # User profile card
│   └── index.ts               # Barrel exports
├── forms/                     # Form-specific components
│   ├── PostForm.tsx           # Create/edit post form
│   └── index.ts               # Barrel exports
├── ui/                        # Base UI components (Shadcn/ui)
│   ├── button.tsx             # Button component
│   ├── form.tsx               # Form wrapper components
│   ├── input.tsx              # Input field component
│   ├── label.tsx              # Label component
│   ├── tabs.tsx               # Tab component
│   ├── textarea.tsx           # Textarea component
│   ├── toast.tsx              # Toast notification
│   ├── toaster.tsx            # Toast container
│   ├── use-toast.ts           # Toast hook
│   └── index.ts               # Barrel exports
└── README.md                  # This documentation
```

### Component Hierarchy

```
📱 App Layout
├── 🔝 Topbar
│   ├── Logo
│   ├── Search
│   └── User Menu
├── 📧 Main Content
│   ├── 📱 Mobile: Full width
│   └── 💻 Desktop: Sidebar + Content
│       ├── LeftSidebar
│       └── Content Area
└── 📱 Bottombar (Mobile only)
    ├── Navigation Icons
    └── Active State
```

---

## 📱 Shared Components

### Topbar.tsx
Main navigation header component.

```tsx
const Topbar = () => {
  const { user, signOut } = useUserContext();
  const navigate = useNavigate();

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          <img 
            src="/assets/images/logo.svg" 
            alt="logo" 
            width={130} 
            height={325} 
          />
        </Link>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="shad-button_ghost"
            onClick={() => signOut()}
          >
            <img src="/assets/icons/logout.svg" alt="logout" />
          </Button>
          <Link to={`/profile/${user.id}`} className="flex-center gap-3">
            <img
              src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-8 w-8 rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};
```

**Features**:
- **Logo/branding**: Clickable home navigation
- **User actions**: Profile access and logout
- **Responsive design**: Adapts to screen size
- **Authentication integration**: Context-aware user state

### LeftSidebar.tsx
Desktop navigation sidebar.

```tsx
const LeftSidebar = () => {
  const { user } = useUserContext();
  const { pathname } = useLocation();

  return (
    <nav className="leftsidebar">
      <div className="flex flex-col gap-11">
        <Link to="/" className="flex gap-3 items-center">
          <img 
            src="/assets/images/logo.svg" 
            alt="logo" 
            width={170} 
            height={36} 
          />
        </Link>

        <Link to={`/profile/${user.id}`} className="flex gap-3 items-center">
          <img
            src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
            alt="profile"
            className="h-14 w-14 rounded-full"
          />
          <div className="flex flex-col">
            <p className="body-bold">{user.name}</p>
            <p className="small-regular text-light-3">@{user.username}</p>
          </div>
        </Link>

        <ul className="flex flex-col gap-6">
          {sidebarLinks.map((link: INavLink) => {
            const isActive = pathname === link.route;
            return (
              <li key={link.label} className={`leftsidebar-link group ${
                isActive && "bg-primary-500"
              }`}>
                <NavLink
                  to={link.route}
                  className="flex gap-4 items-center p-4"
                >
                  <img
                    src={link.imgURL}
                    alt={link.label}
                    className={`group-hover:invert-white ${
                      isActive && "invert-white"
                    }`}
                  />
                  {link.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
```

**Features**:
- **Navigation menu**: Primary app navigation
- **User profile display**: Quick profile access
- **Active state indication**: Visual feedback for current page
- **Responsive hiding**: Hidden on mobile devices

### PostCard.tsx
Social media post display component.

```tsx
const PostCard = ({ post }: { post: Models.Document }) => {
  const { user } = useUserContext();
  
  if (!post.creator) return null;

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creator.$id}`}>
            <img
              src={
                post.creator?.imageUrl ||
                "/assets/icons/profile-placeholder.svg"
              }
              alt="creator"
              className="w-12 lg:h-12 rounded-full"
            />
          </Link>

          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post.creator.name}
            </p>
            <div className="flex-center gap-2 text-light-3">
              <p className="subtle-semibold lg:small-regular ">
                {multiFormatDateString(post.$createdAt)}
              </p>
              •
              <p className="subtle-semibold lg:small-regular">
                {post.location}
              </p>
            </div>
          </div>
        </div>

        <Link
          to={`/update-post/${post.$id}`}
          className={`${user.id !== post.creator.$id && "hidden"}`}
        >
          <img
            src={"/assets/icons/edit.svg"}
            alt="edit"
            width={20}
            height={20}
          />
        </Link>
      </div>

      <Link to={`/posts/${post.$id}`}>
        <div className="small-medium lg:base-medium py-5">
          <p>{post.caption}</p>
          <ul className="flex gap-1 mt-2">
            {post.tags.map((tag: string, index: string) => (
              <li key={`${tag}${index}`} className="text-light-3 small-regular">
                #{tag}
              </li>
            ))}
          </ul>
        </div>

        <img
          src={post.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="post image"
          className="post-card_img"
        />
      </Link>

      <PostStats post={post} userId={user.id} />
    </div>
  );
};
```

**Features**:
- **User information**: Creator profile and timestamp
- **Content display**: Caption, tags, and media
- **Interactive elements**: Like, save, share functionality
- **Edit permissions**: Owner-only edit access
- **Media support**: Image and video content

### FileUploader.tsx
Drag-and-drop file upload component.

```tsx
type FileUploaderProps = {
  fieldChange: (files: File[]) => void;
  mediaUrl: string;
};

const FileUploader = ({ fieldChange, mediaUrl }: FileUploaderProps) => {
  const [file, setFile] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState<string>(mediaUrl);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setFile(acceptedFiles);
      fieldChange(acceptedFiles);
      setFileUrl(URL.createObjectURL(acceptedFiles[0]));
    },
    [file]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpeg", ".jpg"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className="flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer"
    >
      <input {...getInputProps()} className="cursor-pointer" />

      {fileUrl ? (
        <>
          <div className="flex flex-1 justify-center w-full p-5 lg:p-10">
            <img src={fileUrl} alt="image" className="file_uploader-img" />
          </div>
          <p className="file_uploader-label">Click or drag photo to replace</p>
        </>
      ) : (
        <div className="file_uploader-box ">
          <img
            src="/assets/icons/file-upload.svg"
            width={96}
            height={77}
            alt="file upload"
          />
          <h3 className="base-medium text-light-2 mb-2 mt-6">
            Drag photo here
          </h3>
          <p className="text-light-4 small-regular mb-6">SVG, PNG, JPG</p>
          <Button type="button" className="shad-button_dark_4">
            Select from computer
          </Button>
        </div>
      )}
    </div>
  );
};
```

**Features**:
- **Drag & drop**: Intuitive file selection
- **File type validation**: Image format restrictions
- **Preview functionality**: Show selected image
- **Replace capability**: Easy file replacement
- **Accessibility**: Screen reader support

### GridPostList.tsx
Grid layout for post collections.

```tsx
type GridPostListProps = {
  posts: Models.Document[];
  showUser?: boolean;
  showStats?: boolean;
};

const GridPostList = ({
  posts,
  showUser = true,
  showStats = true,
}: GridPostListProps) => {
  const { user } = useUserContext();

  return (
    <ul className="grid-container">
      {posts.map((post) => (
        <li key={post.$id} className="relative min-w-80 h-80">
          <Link to={`/posts/${post.$id}`} className="grid-post_link">
            <img
              src={post.imageUrl}
              alt="post"
              className="h-full w-full object-cover"
            />
          </Link>

          <div className="grid-post_user">
            {showUser && (
              <div className="flex items-center justify-start gap-2 flex-1">
                <img
                  src={
                    post.creator.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="w-8 h-8 rounded-full"
                />
                <p className="line-clamp-1">{post.creator.name}</p>
              </div>
            )}
            {showStats && <PostStats post={post} userId={user.id} />}
          </div>
        </li>
      ))}
    </ul>
  );
};
```

**Features**:
- **Grid layout**: Responsive post grid
- **Optional user info**: Toggleable creator display
- **Optional stats**: Toggleable interaction stats
- **Lazy loading**: Performance optimization
- **Hover effects**: Interactive feedback

---

## 🎨 UI Components

### Button Component
```tsx
// ui/button.tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Variants**:
- `default` - Primary blue button
- `destructive` - Red danger button
- `outline` - Outlined button
- `secondary` - Gray secondary button
- `ghost` - Transparent button
- `link` - Text link button

**Sizes**:
- `default` - Standard size
- `sm` - Small button
- `lg` - Large button
- `icon` - Icon-only button

### Input Component
```tsx
// ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Form Components
```tsx
// ui/form.tsx
const Form = FormProvider

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return <Controller {...props} />
}

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { id } = useFormField()

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    )
  }
)
```

**Features**:
- **React Hook Form integration**: Seamless form handling
- **Validation support**: Error display and handling
- **Accessibility**: Proper ARIA attributes
- **Consistent styling**: Theme-aware components

### Toast System
```tsx
// ui/use-toast.ts
const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const { toast, dismiss } = toastSlice.actions
```

**Usage**:
```tsx
// Success toast
toast({
  title: "Success!",
  description: "Your post has been created.",
})

// Error toast
toast({
  title: "Error",
  description: "Something went wrong.",
  variant: "destructive",
})
```

---

## 📝 Form Components

### PostForm.tsx
Comprehensive post creation/editing form.

```tsx
type PostFormProps = {
  post?: Models.Document;
  action: "Create" | "Update";
};

const PostForm = ({ post, action }: PostFormProps) => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const { toast } = useToast();

  // Queries
  const { mutateAsync: createPost, isLoading: isLoadingCreate } =
    useCreatePost();
  const { mutateAsync: updatePost, isLoading: isLoadingUpdate } =
    useUpdatePost();

  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post ? post?.caption : "",
      file: [],
      location: post ? post.location : "",
      tags: post ? post.tags.join(",") : "",
    },
  });

  // Handler
  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    // ACTION = UPDATE
    if (post && action === "Update") {
      const updatedPost = await updatePost({
        ...value,
        postId: post.$id,
        imageId: post.imageId,
        imageUrl: post.imageUrl,
      });

      if (!updatedPost) {
        toast({
          title: `${action} post failed. Please try again.`,
        });
      }
      return navigate(`/posts/${post.$id}`);
    }

    // ACTION = CREATE
    const newPost = await createPost({
      ...value,
      userId: user.id,
    });

    if (!newPost) {
      toast({
        title: `${action} post failed. Please try again.`,
      });
    }
    navigate("/");
  };
```

**Features**:
- **Dual mode**: Create and update functionality
- **File upload**: Integrated image upload
- **Tag system**: Hashtag support
- **Location tagging**: Geographic information
- **Validation**: Comprehensive input validation
- **Loading states**: User feedback during submission

### Form Validation
```typescript
// lib/validation/index.ts
export const PostValidation = z.object({
  caption: z.string().min(5, { message: "Minimum 5 characters." }).max(2200, { message: "Maximum 2200 caracters" }),
  file: z.custom<File[]>(),
  location: z.string().min(1, { message: "This field is required" }).max(1000, { message: "Maximum 1000 characters." }),
  tags: z.string(),
});

export const ProfileValidation = z.object({
  file: z.custom<File[]>(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
  bio: z.string(),
});
```

---

## 🎯 Component Guidelines

### Design Principles

#### 1. Consistency
- **Visual hierarchy**: Consistent typography and spacing
- **Color palette**: Cohesive color scheme across components
- **Interaction patterns**: Standardized hover and active states

#### 2. Accessibility
- **Keyboard navigation**: Full keyboard support
- **Screen readers**: Proper ARIA labels and roles
- **Color contrast**: WCAG AA compliant contrast ratios
- **Focus indicators**: Clear focus states

#### 3. Performance
- **Bundle splitting**: Component-level code splitting
- **Lazy loading**: Images and content lazy loading
- **Memoization**: React.memo for expensive components
- **Tree shaking**: Dead code elimination

#### 4. Reusability
- **Prop interfaces**: Well-defined TypeScript props
- **Composition**: Composable component patterns
- **Theming**: CSS variables for customization
- **Documentation**: Comprehensive prop documentation

### Component Structure
```tsx
// Standard component structure
interface ComponentProps {
  // Required props
  required: string;
  
  // Optional props with defaults
  optional?: boolean;
  
  // Event handlers
  onClick?: () => void;
  
  // Style overrides
  className?: string;
  
  // Children for composition
  children?: React.ReactNode;
}

const Component: React.FC<ComponentProps> = ({
  required,
  optional = false,
  onClick,
  className,
  children,
  ...props
}) => {
  // Component logic
  const [state, setState] = useState(false);
  
  // Event handlers
  const handleClick = () => {
    onClick?.();
    setState(!state);
  };
  
  // Render
  return (
    <div
      className={cn("base-styles", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Component;
```

### CSS Classes Convention
```css
/* Component-specific classes */
.post-card {
  @apply bg-dark-2 rounded-3xl border border-dark-4 p-5 lg:p-7 w-full max-w-screen-sm;
}

.post-card_img {
  @apply h-64 xs:h-[400px] lg:h-[450px] w-full rounded-[24px] object-cover mb-5;
}

/* Utility classes */
.flex-center {
  @apply flex justify-center items-center;
}

.flex-between {
  @apply flex justify-between items-center;
}

/* State classes */
.invert-white {
  @apply invert brightness-0 transition;
}

.group-hover\:invert-white:hover {
  @apply invert brightness-0 transition;
}
```

---

## 🚀 Usage Examples

### Basic Component Usage
```tsx
// Import components
import { Button, Input, PostCard } from "@/components";

// Use in your component
const MyComponent = () => {
  return (
    <div className="space-y-4">
      <Button variant="default" size="lg">
        Primary Button
      </Button>
      
      <Input
        type="email"
        placeholder="Enter your email"
        className="w-full"
      />
      
      <PostCard post={postData} />
    </div>
  );
};
```

### Form Integration
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui";

const MyForm = () => {
  const form = useForm({
    resolver: zodResolver(mySchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
```

### Layout Composition
```tsx
import { Topbar, LeftSidebar, Bottombar } from "@/components/shared";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full md:flex">
      <Topbar />
      <LeftSidebar />
      
      <section className="flex flex-1 h-full">
        {children}
      </section>
      
      <Bottombar />
    </div>
  );
};
```

---

## 🔧 Customization

### Theme Customization
```css
/* tailwind.config.js */
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary': {
          500: '#877EFF',
          600: '#5D5FEF',
        },
        'dark': {
          1: '#000000',
          2: '#09090A',
          3: '#101012',
          4: '#1F1F22',
        },
        'light': {
          1: '#FFFFFF',
          2: '#EFEFEF',
          3: '#7878A3',
          4: '#5C5C7B',
        },
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
};
```

### Component Variants
```tsx
// Add custom variants to existing components
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Add custom variant
        marine: "bg-blue-600 text-white hover:bg-blue-700",
      },
    },
  }
);
```

### Custom Hooks Integration
```tsx
// Custom component with hooks
import { useUserContext, useToast } from "@/hooks";

const CustomComponent = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  
  const handleAction = () => {
    toast({
      title: `Hello ${user.name}!`,
      description: "Action completed successfully.",
    });
  };
  
  return (
    <Button onClick={handleAction}>
      Custom Action
    </Button>
  );
};
```

---

## 🔗 Related Documentation

- **[🎨 Frontend Application](../README.md)** - Main frontend documentation
- **[🔐 Authentication System](../_auth/README.md)** - Auth components integration
- **[🏠 Main Project](../../README.md)** - Overall project documentation
- **[🌊 Backend APIs](../Backend/README.md)** - API integration examples

### External Resources
- **[Shadcn/ui Documentation](https://ui.shadcn.com/)** - Base component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Hook Form](https://react-hook-form.com/)** - Form management
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI components

---

<div align="center">

**🧩 Building beautiful interfaces for the marine community**

[Component Storybook](./storybook) • [Design System](./design-system) • [Accessibility Guide](./accessibility)

</div>
