import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/AuthContext";
import { useIsFollowing, useFollowUser, useUnfollowUser } from "@/lib/react-query/followQueries";
import { useState } from "react";

type FollowButtonProps = {
  userId: string;
  className?: string;
  size?: "small" | "medium" | "large";
  variant?: "primary" | "secondary";
  showIcon?: boolean;
  disabled?: boolean;
};

const FollowButton = ({ 
  userId, 
  className = "",
  size = "medium",
  variant = "primary",
  showIcon = true,
  disabled = false
}: FollowButtonProps) => {
  const { user } = useUserContext();
  const [hoverState, setHoverState] = useState(false);

  // Get actual follow status from database
  const { data: isFollowing = false, isLoading: isCheckingFollow } = useIsFollowing(
    user?.id || "", 
    userId
  );

  // Follow/unfollow mutations
  const { mutate: followUser, isPending: isFollowing_ } = useFollowUser();
  const { mutate: unfollowUser, isPending: isUnfollowing } = useUnfollowUser();

  // Don't show follow button for current user
  if (!user || user.id === userId) {
    return null;
  }

  const isLoading = isCheckingFollow || isFollowing_ || isUnfollowing;

  const handleFollow = () => {
    if (isLoading || disabled) return;

    if (isFollowing) {
      unfollowUser({ 
        followerId: user.id, 
        followingId: userId 
      });
    } else {
      followUser({ 
        followerId: user.id, 
        followingId: userId 
      });
    }
  };

  // Button size classes
  const sizeClasses = {
    small: "px-3 py-1.5 text-xs h-8",
    medium: "px-4 py-2 text-sm h-9", 
    large: "px-6 py-3 text-base h-11"
  };

  // Dynamic button text based on state
  const getButtonText = () => {
    if (isLoading) return "...";
    if (isFollowing && hoverState) return "Unfollow";
    if (isFollowing) return "Following";
    return "Follow";
  };

  // Dynamic button classes
  const getButtonClasses = () => {
    const baseClasses = `
      ${sizeClasses[size]}
      ${className}
      whitespace-nowrap
      transition-all
      duration-200
      relative
      overflow-hidden
    `;

    if (disabled || isLoading) {
      return `${baseClasses} opacity-50 cursor-not-allowed bg-gray-400`;
    }

    if (variant === "secondary") {
      if (isFollowing) {
        return `${baseClasses} border-2 border-gray-400 text-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50`;
      }
      return `${baseClasses} border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white`;
    }

    // Primary variant
    if (isFollowing) {
      return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white border border-gray-300`;
    }
    return `${baseClasses} bg-primary-500 text-white hover:bg-primary-600`;
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={disabled || isLoading}
      className={getButtonClasses()}
      onMouseEnter={() => setHoverState(true)}
      onMouseLeave={() => setHoverState(false)}
    >
      <div className="flex items-center gap-2">
        {showIcon && !isLoading && (
          <span className={`${size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'}`}>
            {isFollowing ? (hoverState ? "−" : "✓") : "+"}
          </span>
        )}
        
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        )}
        
        <span className="hidden sm:inline font-medium">
          {getButtonText()}
        </span>
        
        {/* Mobile icon only */}
        <span className="sm:hidden">
          {isLoading ? "" : isFollowing ? (hoverState ? "−" : "✓") : "+"}
        </span>
      </div>
    </Button>
  );
};

export default FollowButton;