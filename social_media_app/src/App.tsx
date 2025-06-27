import { Routes, Route } from "react-router-dom";
import {
  Home,
  Explore,
  CreatePost,
  Profile,
  EditPost,
  PostDetails,
  UpdateProfile,
  AllUsers,
  Messenger,
  Marketplace,
  PFZPredictionSimple,
  CreateMarketplaceListing,
  MarketplaceItemDetails,
  MyMarketplaceListings,
} from "@/_root/pages";

import AuthLayout from "./_auth/AuthLayout";
import RootLayout from "./_root/RootLayout";
import SigninForm from "@/_auth/forms/SigninForm";
import SignupForm from "@/_auth/forms/SignupForm";
import ForgotPasswordForm from "@/_auth/forms/ForgotPasswordForm";
import ResetPasswordForm from "@/_auth/forms/ResetPasswordForm";
import { Toaster } from "@/components/ui/toaster";

import IOTDashboard from "@/_root/pages/IOTDashboard";
import EODashboard from "@/_root/pages/EODashboard";

import "./globals.css";

const App = () => {
  return (
    <main className="flex h-screen">
      <Routes>        
        {/* public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SigninForm />} />
          <Route path="/sign-up" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
        </Route>

        {/* private routes */}
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          
          {/* NEW: Dashboard sub-routes */}
          <Route path="/dashboard/iot" element={<IOTDashboard />} />
          <Route path="/dashboard/eo" element={<EODashboard />} />
          
          <Route path="/pfz-prediction" element={<PFZPredictionSimple />} />
          <Route path="/messenger" element={<Messenger />} />

          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/create" element={<CreateMarketplaceListing />} />
          <Route path="/marketplace/my-listings" element={<MyMarketplaceListings />} />
          <Route path="/marketplace/item/:id" element={<MarketplaceItemDetails />} />
          <Route path="/marketplace/item/:id/edit" element={<CreateMarketplaceListing />} />

          <Route path="/explore" element={<Explore />} />
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/update-post/:id" element={<EditPost />} />
          <Route path="/posts/:id" element={<PostDetails />} />
          <Route path="/profile/:id/*" element={<Profile />} />
          <Route path="/update-profile/:id" element={<UpdateProfile />} />
        </Route>
      </Routes>

      <Toaster />
    </main>
  );
};

export default App;