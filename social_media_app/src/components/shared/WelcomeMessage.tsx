import { Link } from "react-router-dom";
import { useUserContext } from "@/context/AuthContext";

const WelcomeMessage = () => {
  const { user } = useUserContext();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-dark-3 rounded-xl mb-6">
      <div className="flex items-center mb-4">
        <img 
          src="/assets/images/logo.svg" 
          alt="Snapgram"
          className="w-8 h-8 mr-3"
        />
        <h2 className="h2-bold text-light-1">Welcome to Snapgram!</h2>
      </div>
      
      <p className="body-medium text-light-3 text-center mb-6 max-w-md">
        Hi {user.name}! 👋 You're now part of our amazing community. 
        Start by sharing your first moment or exploring what others have posted.
      </p>
      
      <div className="flex gap-4">
        <Link 
          to="/create-post" 
          className="shad-button_primary"
        >
          Share Your First Post
        </Link>
        <Link 
          to="/explore" 
          className="shad-button_dark_4"
        >
          Explore Posts
        </Link>
      </div>
    </div>
  );
};

export default WelcomeMessage;
