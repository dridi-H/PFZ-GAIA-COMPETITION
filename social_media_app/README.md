# 🎨 Wita Frontend - React Application

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)
![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.3-06B6D4.svg)

[🏠 Back to Main](../README.md) | [🔧 Setup Guide](#-setup) | [📚 Components](#-components) | [🎯 Features](#-features)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🔧 Setup](#-setup)
- [📚 Components](#-components)
- [🎯 Features](#-features)
- [🌐 Pages](#-pages)
- [📡 API Integration](#-api-integration)
- [🎨 Styling](#-styling)
- [🧪 Development](#-development)

---

## 🌟 Overview

The Wita frontend is a modern React application built with TypeScript and Vite, providing a comprehensive user interface for marine ecosystem monitoring and social networking. It features multiple dashboards, real-time data visualization, and seamless user interactions.

### Key Capabilities
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Real-time Updates**: Live data from IoT sensors and satellite feeds
- **Interactive Maps**: Leaflet integration for geospatial visualization
- **Social Features**: Posts, comments, messaging, and user profiles
- **Data Visualization**: Charts and graphs using Recharts
- **Type Safety**: Full TypeScript coverage

---

## 🛠️ Tech Stack

### Core Technologies
- **[React 18](https://reactjs.org/)** - Component-based UI library
- **[TypeScript](https://typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[React Router DOM](https://reactrouter.com/)** - Client-side routing

### UI & Styling
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icons
- **[Tailwind Animate](https://github.com/jamiebuilds/tailwindcss-animate)** - CSS animations

### Data Management
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[React Hook Form](https://react-hook-form.com/)** - Form management
- **[Zod](https://zod.dev/)** - Schema validation
- **[Supabase](https://supabase.io/)** - Backend and real-time database

### Visualization & Maps
- **[Leaflet](https://leafletjs.com/)** - Interactive maps
- **[React Leaflet](https://react-leaflet.js.org/)** - React bindings for Leaflet
- **[Recharts](https://recharts.org/)** - Data visualization charts

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[TypeScript ESLint](https://typescript-eslint.io/)** - TypeScript-specific linting

---

## 🏗️ Architecture

```
src/
├── _auth/                     # Authentication Module
│   ├── AuthLayout.tsx         # Auth page layout
│   └── forms/                 # Login/Signup forms
│       ├── SigninForm.tsx
│       ├── SignupForm.tsx
│       ├── ForgotPasswordForm.tsx
│       └── ResetPasswordForm.tsx
│
├── _root/                     # Protected Application
│   ├── RootLayout.tsx         # Main app layout
│   └── pages/                 # Application pages
│       ├── Home.tsx           # Social feed
│       ├── Dashboard.tsx      # Main dashboard
│       ├── IOTDashboard.tsx   # IoT sensor monitoring
│       ├── EODashboard.tsx    # Earth observation data
│       ├── PFZPrediction.tsx  # ML predictions
│       ├── Marketplace.tsx    # Community marketplace
│       ├── Messenger.tsx      # Real-time messaging
│       ├── Profile.tsx        # User profiles
│       └── ...
│
├── components/                # Reusable Components
│   ├── shared/                # Common components
│   │   ├── LeftSidebar.tsx    # Navigation sidebar
│   │   ├── Topbar.tsx         # Header navigation
│   │   ├── PostCard.tsx       # Social post display
│   │   ├── UserCard.tsx       # User profile card
│   │   └── ...
│   ├── ui/                    # UI primitives
│   │   ├── button.tsx         # Button component
│   │   ├── input.tsx          # Input component
│   │   ├── toast.tsx          # Notification system
│   │   └── ...
│   └── forms/                 # Form components
│       └── PostForm.tsx       # Post creation form
│
├── lib/                       # Utilities & Config
│   ├── supabase/              # Supabase integration
│   │   ├── api.ts             # API functions
│   │   └── config.ts          # Client configuration
│   ├── react-query/           # Query management
│   │   ├── queries.ts         # Query definitions
│   │   └── QueryProvider.tsx  # Query provider
│   ├── validation/            # Form schemas
│   │   └── index.ts           # Zod schemas
│   └── utils.ts               # Utility functions
│
├── context/                   # React Context
│   └── AuthContext.tsx        # Authentication state
│
├── hooks/                     # Custom Hooks
│   └── useDebounce.ts         # Debouncing hook
│
├── types/                     # TypeScript Types
│   └── index.ts               # Global type definitions
│
├── constants/                 # Application Constants
│   └── index.ts               # Navigation links, etc.
│
├── globals.css                # Global styles
├── App.tsx                    # Root component
└── main.tsx                   # Application entry point
```

---

## 🔧 Setup

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Git** for version control

### Installation

1. **Navigate to frontend directory**:
   ```bash
   cd social_media_app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**:
   Create `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_BACKEND_URL=http://localhost:5000
   VITE_ML_API_URL=http://localhost:8501
   ```

4. **Start development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

---

## 📚 Components

### 🔐 Authentication Components
📂 **[Authentication Module](./src/_auth/README.md)**
- SigninForm, SignupForm
- Password reset functionality
- Protected route handling

### 🧩 Shared Components
📂 **[Shared Components](./src/components/shared/README.md)**
- Navigation (LeftSidebar, Topbar, Bottombar)
- Social features (PostCard, UserCard, PostStats)
- File uploaders and loaders
- Comments system

### 🎨 UI Components
📂 **[UI Components](./src/components/ui/README.md)**
- Button, Input, Textarea
- Toast notifications
- Form components
- Tabs and labels

### 📊 Dashboard Components
📂 **[Dashboard Components](./src/_root/pages/dashboards/README.md)**
- IoT sensor monitoring
- Earth observation data visualization
- Real-time charts and metrics

---

## 🎯 Features

### 🌐 Social Media Platform
- **Post Creation**: Rich text posts with image upload
- **Social Interactions**: Like, save, comment functionality
- **User Profiles**: Customizable profiles with bio and stats
- **Content Discovery**: Explore page with search and filtering
- **Follow System**: User following and follower management

### 📊 Real-time Dashboards
- **IoT Dashboard**: Live sensor data from marine devices
- **EO Dashboard**: Satellite Earth observation data
- **Analytics**: Charts, graphs, and data visualization
- **Alerts**: Real-time notifications for critical events

### 🤖 AI/ML Integration
- **PFZ Predictions**: Machine learning-based fishing zone predictions
- **Interactive Maps**: Geospatial visualization with Leaflet
- **Data Analysis**: Historical trend analysis and forecasting

### 🛒 Marketplace
- **Item Listings**: Buy/sell marine equipment
- **Search & Filter**: Advanced product discovery
- **User Communication**: Direct messaging between users
- **Image Galleries**: Multiple product images

### 💬 Messaging System
- **Real-time Chat**: Instant messaging between users
- **Emoji Support**: Rich text with emoji picker
- **File Sharing**: Document and image attachments
- **Online Status**: User presence indicators

---

## 🌐 Pages

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Social media feed and top creators |
| **Dashboard** | `/dashboard/*` | Main dashboard with IoT/EO data |
| **IoT Dashboard** | `/dashboard/iot` | IoT sensor monitoring |
| **EO Dashboard** | `/dashboard/eo` | Earth observation data |
| **PFZ Prediction** | `/pfz-prediction` | ML-based fishing zone predictions |
| **Marketplace** | `/marketplace` | Community marketplace |
| **Messenger** | `/messenger` | Real-time messaging |
| **Profile** | `/profile/:id` | User profiles and posts |
| **Explore** | `/explore` | Content discovery and search |
| **All Users** | `/all-users` | User directory |

---

## 📡 API Integration

### Supabase Integration
```typescript
// lib/supabase/config.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### React Query Setup
```typescript
// lib/react-query/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})
```

### Backend APIs
- **Flask Backend**: Ocean data and IoT integration
- **Streamlit ML**: Machine learning predictions
- **Supabase**: Real-time database and authentication

---

## 🎨 Styling

### TailwindCSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': {
          500: '#8B5CF6',
          600: '#7C3AED'
        },
        'dark': {
          1: '#000000',
          2: '#1F1F22',
          3: '#2F2F33',
          4: '#3F3F44'
        }
      }
    }
  }
}
```

### Global Styles
Custom CSS classes for consistent styling across components:
- Dark theme optimized for marine applications
- Responsive breakpoints for all device sizes
- Custom scrollbars and animations
- Utility classes for common patterns

---

## 🧪 Development

### Development Guidelines
1. **Component Structure**: Each component in its own file
2. **Type Safety**: Use TypeScript interfaces for all props
3. **Error Handling**: Implement proper error boundaries
4. **Performance**: Use React.memo for expensive components
5. **Accessibility**: Follow ARIA guidelines

### Code Style
- **ESLint**: Configured with TypeScript rules
- **Prettier**: Code formatting on save
- **Naming**: PascalCase for components, camelCase for functions
- **Imports**: Absolute imports using `@/` alias

### Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Performance Optimization
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Lazy load heavy components
- **Image Optimization**: Optimized image loading
- **Bundle Analysis**: Monitor bundle size

---

## 🔗 Related Documentation

- **[🏠 Main Project](../README.md)** - Overall project documentation
- **[🔧 Backend APIs](./Backend/README.md)** - Flask backend services
- **[🤖 ML Services](../pfz-prediction-app/README.md)** - Machine learning components
- **[🔐 Authentication](./src/_auth/README.md)** - Auth system details
- **[📊 Dashboards](./src/_root/pages/dashboards/README.md)** - Dashboard components

---

<div align="center">

**Built with ❤️ for the marine community**

[Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues) • [Documentation](../README.md)

</div>
