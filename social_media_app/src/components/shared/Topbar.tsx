import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../ui/button";
import { useUserContext } from "@/context/AuthContext";
import { useSignOutAccount } from "@/lib/react-query/queries";

const Topbar = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const { mutate: signOut, isSuccess, isPending } = useSignOutAccount();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setIsSigningOut(false);
      // Navigate to sign-in page instead of refreshing
      navigate("/sign-in");
    }
  }, [isSuccess, navigate]);

  const handleSignOut = () => {
    setIsSigningOut(true);
    signOut();
  };

  // Don't render if user is not available
  if (!user) {
    return null;
  }

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          {/* Fish Icon + Wita Text Logo */}
          <div className="flex items-center gap-3">
            {/* Purple Fish Icon */}
            <svg width="28" height="28" viewBox="0 0 135 135" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="#8B5CF6" d="M76.7,107c11.1-9.5,27.5-27.3,27.1-50.2C103.5,38,91.7,19.7,68.8,2.5c-0.8-0.6-1.9-0.6-2.7,0
                C43.3,19.7,31.5,38,31.2,56.9c-0.4,22.9,16,40.7,27.2,50.2l-22.9,20.3c-0.6,0.5-0.8,1.2-0.7,2c0.1,0.7,0.5,1.4,1.2,1.7
                c2.4,1.3,5.3,1.9,8.5,1.9c6.9,0,14.9-3,20.8-8.2c0.9-0.8,1.7-1.5,2.4-2.4c0.7,0.8,1.5,1.6,2.4,2.4c8.6,7.6,21.5,10.4,29.2,6.4
                c0.7-0.3,1.1-1,1.2-1.7c0.1-0.7-0.2-1.5-0.7-2L76.7,107z M67.5,7.1c14,10.8,23.4,21.9,28.2,33.2H39.3C44.1,29,53.5,17.9,67.5,7.1z
                M73,121.4c-1.4-1.2-2.6-2.6-3.5-3.9c-0.4-0.6-1.1-1-1.9-1s-1.5,0.4-1.9,1c-0.9,1.4-2.1,2.7-3.5,3.9c-5.9,5.2-14.6,7.9-20.8,6.8
                l22-19.5c0.5-0.4,0.8-1.1,0.8-1.7c0-0.7-0.3-1.3-0.8-1.7C38.9,85.7,35.6,66.6,35.7,57c0.1-4.1,0.7-8.1,2-12.2h59.6
                c1.2,4,1.9,8.1,2,12.1c0.2,9.6-3.2,28.7-27.4,48.3c-0.5,0.4-0.8,1-0.8,1.7c0,0.7,0.3,1.3,0.8,1.7l22,19.6
                C87.6,129.3,78.9,126.6,73,121.4z"/>
              <circle fill="#8B5CF6" cx="58.3" cy="29.4" r="3.7"/>
              <path fill="#8B5CF6" d="M80.1,59.2c-1.2,0-2.2,1-2.2,2.2c0,2.2-1.8,4.1-4,4.1c-1.3,0-2.6-0.7-3.4-1.8c-0.5-0.7-0.7-1.5-0.7-2.4
                c0-0.7-0.4-1.4-1-1.8c-0.1-0.1-0.2-0.1-0.3-0.2c-0.1-0.1-0.2-0.1-0.3-0.1c-0.1,0-0.1,0-0.2,0c-0.1,0-0.3,0-0.4,0
                c-0.2,0-0.4,0-0.6,0.1c-0.1,0-0.2,0.1-0.3,0.1c-0.6,0.3-1,0.9-1.2,1.5c-0.1,0.3,0,0.7-0.1,1c0,0.3-0.1,0.7-0.3,1
                c-0.5,1.2-1.6,2.2-2.9,2.5c-0.3,0.1-0.6,0.1-0.9,0.1c-2.2,0-4.1-1.8-4.1-4.1c0-1.2-1-2.2-2.2-2.2c-1.2,0-2.2,1-2.2,2.2
                c0,4,2.7,7.3,6.4,8.3c0.7,4,4.2,7,8.4,7s7.7-3,8.4-7c3.7-1,6.4-4.3,6.4-8.3C82.3,60.2,81.3,59.2,80.1,59.2z M67.5,72.3
                c-1.7,0-3.2-1.1-3.8-2.6c1.5-0.4,2.8-1.3,3.8-2.4c1,1.1,2.3,2,3.8,2.4C70.7,71.2,69.2,72.3,67.5,72.3z"/>
              <circle fill="#8B5CF6" cx="57.5" cy="89.1" r="2.3"/>
              <circle fill="#8B5CF6" cx="63.4" cy="95.8" r="2.3"/>
              <circle fill="#8B5CF6" cx="50.6" cy="82.2" r="2.3"/>
            </svg>
            
            {/* Wita Text */}
            <span className="text-white font-bold text-xl tracking-wide">Wita</span>
          </div>
        </Link>

        <div className="flex gap-4 items-center">
          {/* Logout Button */}
          <Button
            variant="ghost"
            className="shad-button_ghost relative"
            onClick={handleSignOut}
            disabled={isPending || isSigningOut}
            title="Sign out"
          >
            {isPending || isSigningOut ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
            ) : (
              <img 
                src="/assets/icons/logout.svg" 
                alt="logout"
                className="h-5 w-5"
              />
            )}
          </Button>

          {/* Profile Link */}
          <Link 
            to={`/profile/${user.id}`} 
            className="flex-center gap-3 hover:opacity-80 transition-opacity"
            title={`Go to ${user.name || user.username || 'your'} profile`}
          >
            <img
              src={user.image_url || "/assets/icons/profile-placeholder.svg"}
              alt={`${user.name || user.username || 'User'} profile`}
              className="h-8 w-8 rounded-full object-cover border-2 border-transparent hover:border-primary-500 transition-colors"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/assets/icons/profile-placeholder.svg";
              }}
            />
            {/* Optional: Show username on larger screens */}
            <span className="hidden md:block text-sm font-medium text-light-2">
              {user.name || user.username}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Topbar;