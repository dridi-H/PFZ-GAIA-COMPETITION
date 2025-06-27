import { Link } from "react-router-dom";
import { FollowButton } from "@/components/shared";

type UserCardProps = {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    image_url: string;
    bio?: string;
  };
};

const UserCard = ({ user }: UserCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking the follow button
    if ((e.target as HTMLElement).closest('button')) {
      e.preventDefault();
    }
  };

  return (
    <div className="user-card" onClick={handleCardClick}>
      <Link to={`/profile/${user.id}`} className="flex flex-col items-center">
        <img
          src={user.image_url || "/assets/icons/profile-placeholder.svg"}
          alt="creator"
          className="rounded-full w-14 h-14"
        />

        <div className="flex-center flex-col gap-1 mt-3">
          <p className="base-medium text-light-1 text-center line-clamp-1">
            {user.name}
          </p>
          <p className="small-regular text-light-3 text-center line-clamp-1">
            @{user.username}
          </p>
        </div>
      </Link>

      <FollowButton 
        userId={user.id} 
        size="small"
        className="mt-3"
      />
    </div>
  );
};

export default UserCard;