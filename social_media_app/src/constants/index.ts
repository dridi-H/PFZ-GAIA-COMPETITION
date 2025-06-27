export const sidebarLinks = [
  {
    imgURL: "/assets/icons/home.svg",
    route: "/",
    label: "Home",
  },
  {
    imgURL: "/assets/icons/posts.svg",
    route: "/dashboard",
    label: "Dashboard",
  },
  {
    imgURL: "/assets/icons/filter.svg",
    route: "/pfz-prediction",
    label: "PFZ Prediction",
  },
  {
    imgURL: "/assets/icons/chat.svg",
    route: "/messenger",
    label: "Messenger",
  },
  {
    imgURL: "/assets/icons/marketplace.svg",
    route: "/marketplace",
    label: "Marketplace",
  },
  {
    imgURL: "/assets/icons/people.svg",
    route: "/all-users",
    label: "People",
  },
];

export const bottombarLinks = [
  {
    imgURL: "/assets/icons/home.svg",
    route: "/",
    label: "Home",
  },
  {
    imgURL: "/assets/icons/marketplace.svg",
    route: "/marketplace",
    label: "Marketplace",
  },
  {
    imgURL: "/assets/icons/people.svg",
    route: "/all-users",
    label: "People",
  },
];

// Marketplace Categories
export const MARKETPLACE_CATEGORIES = [
  { id: "all", name: "All", icon: "🏪" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "fashion", name: "Fashion", icon: "👕" },
  { id: "home", name: "Home & Garden", icon: "🏠" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "books", name: "Books", icon: "📚" },
  { id: "vehicles", name: "Vehicles", icon: "🚗" },
  { id: "toys", name: "Toys & Games", icon: "🎮" },
  { id: "beauty", name: "Beauty", icon: "💄" },
  { id: "music", name: "Music & Arts", icon: "🎵" },
  { id: "other", name: "Other", icon: "📦" },
];

// Condition Options
export const CONDITION_OPTIONS = [
  { value: "New", label: "New", description: "Brand new, never used" },
  {
    value: "Like New",
    label: "Like New",
    description: "Barely used, excellent condition",
  },
  { value: "Good", label: "Good", description: "Some wear, but still in good shape" },
  { value: "Fair", label: "Fair", description: "Noticeable wear, but functional" },
];

// Sort Options
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];