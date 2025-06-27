import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronRight, Droplets, Wifi } from "lucide-react";

import { INavLink } from "@/types";
import { sidebarLinks } from "@/constants";
import { Loader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useSignOutAccount } from "@/lib/react-query/queries";
import { useUserContext, INITIAL_USER } from "@/context/AuthContext";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, setUser, setIsAuthenticated, isLoading } = useUserContext();
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);

  const { mutate: signOut } = useSignOutAccount();

  const handleSignOut = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    signOut();
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    navigate("/sign-in");
  };

  // Dashboard dropdown options
  const dashboardOptions = [
    {
      id: 'iot',
      title: 'IoT Dashboard',
      description: 'Monitor sensors and devices',
      icon: Wifi,
      color: 'text-blue-400',
      route: '/dashboard/iot'
    },
    {
      id: 'eo',
      title: 'EO Dashboard', 
      description: 'Water quality monitoring',
      icon: Droplets,
      color: 'text-green-400',
      route: '/dashboard/eo'
    }
  ];

  // FIXED: Better loading condition
  const shouldShowLoader = isLoading && !user.id;
  const hasValidUser = user && user.id && user.name;

  const renderIcon = (link: INavLink, isActive: boolean) => {
    // Use custom SVG files for specific routes only
    if (link.route === '/dashboard') {
      return (
        <img
          src="/assets/icons/dash.svg"
          alt={link.label}
          className={`w-6 h-6 group-hover:invert-white ${isActive && "invert-white"}`}
        />
      );
    } else if (link.route === '/pfz-prediction') {
      return (
        <img
          src="/assets/icons/ai.svg"
          alt={link.label}
          className={`w-6 h-6 group-hover:invert-white ${isActive && "invert-white"}`}
        />
      );
    } else if (link.route === '/marketplace') {
      return (
        <img
          src="/assets/icons/market.svg"
          alt={link.label}
          className={`w-6 h-6 group-hover:invert-white ${isActive && "invert-white"}`}
        />
      );
    } else {
      // Use the original icon for all other routes (including Home)
      return (
        <img
          src={link.imgURL}
          alt={link.label}
          className={`w-6 h-6 group-hover:invert-white ${isActive && "invert-white"}`}
        />
      );
    }
  };

  const renderDashboardItem = (link: INavLink) => {
    const isActive = pathname.includes('/dashboard');
    
    return (
      <li
        key={link.label}
        className="relative"
        onMouseEnter={() => setIsDashboardDropdownOpen(true)}
        onMouseLeave={() => setIsDashboardDropdownOpen(false)}
      >
        <div className={`leftsidebar-link group ${isActive && "bg-primary-500"}`}>
          {/* Changed from NavLink to a div to make it unclickable */}
          <div className="flex gap-4 items-center p-4 text-light-2 hover:text-white w-full cursor-default">
            {renderIcon(link, isActive)}
            <span className={`${isActive ? "text-white" : "text-light-2"} flex-1`}>
              {link.label}
            </span>
            <ChevronRight 
              className={`w-4 h-4 transition-transform ${isDashboardDropdownOpen ? 'rotate-90' : ''} ${isActive ? "text-white" : "text-light-2"}`}
            />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isDashboardDropdownOpen && (
          <div className="absolute left-full top-0 ml-2 w-72 bg-dark-2 border border-dark-4 rounded-lg shadow-xl z-50">
            <div className="p-3">
              <div className="text-light-3 text-xs font-medium mb-3 px-2">
                Choose Dashboard Type
              </div>
              
              {dashboardOptions.map((option) => (
                <NavLink
                  key={option.id}
                  to={option.route}
                  className={({ isActive }) => 
                    `flex items-center gap-3 p-3 rounded-lg hover:bg-dark-3 transition-colors group ${
                      isActive ? 'bg-primary-500 text-white' : 'text-light-2'
                    }`
                  }
                  onClick={() => setIsDashboardDropdownOpen(false)}
                >
                  <div className={`p-2 rounded-lg bg-dark-4 group-hover:bg-dark-1`}>
                    <option.icon className={`w-4 h-4 ${option.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.title}</div>
                    <div className="text-xs text-light-3 group-hover:text-light-2">
                      {option.description}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <nav className="leftsidebar">
      <div className="flex flex-col gap-11 flex-1">
        <Link to="/" className="flex gap-3 items-center">
          {/* Fish Icon + Wita Text Logo */}
          <div className="flex items-center gap-3">
            {/* Purple Fish Icon */}
            <svg width="32" height="32" viewBox="0 0 135 135" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <span className="text-white font-bold text-2xl tracking-wide">Wita</span>
          </div>
        </Link>

        {/* FIXED: Better loading logic to prevent infinite spinner */}
        {shouldShowLoader ? (
          <div className="h-14 flex items-center justify-center">
            <Loader />
          </div>
        ) : hasValidUser ? (
          <Link to={`/profile/${user.id}`} className="flex gap-3 items-center">
            <img
              src={user.image_url || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-14 w-14 rounded-full object-cover"
              onError={(e) => {
                // FIXED: Handle broken images to prevent infinite loading
                const target = e.target as HTMLImageElement;
                target.src = "/assets/icons/profile-placeholder.svg";
              }}
            />
            <div className="flex flex-col">
              <p className="body-bold">{user.name}</p>
              <p className="small-regular text-light-3">@{user.username}</p>
            </div>
          </Link>
        ) : (
          // FIXED: Fallback for when user is not loaded but we're not loading
          <div className="h-14 flex items-center justify-center">
            <div className="w-10 h-10 bg-dark-3 rounded-full"></div>
          </div>
        )}        

        <ul className="flex flex-col gap-3 flex-1">
          {sidebarLinks.map((link: INavLink) => {
            // Special handling for Dashboard item
            if (link.route === '/dashboard') {
              return renderDashboardItem(link);
            }

            // Regular sidebar items
            const isActive = pathname === link.route;

            return (
              <li
                key={link.label}
                className={`leftsidebar-link group ${
                  isActive && "bg-primary-500"
                }`}>
                <NavLink
                  to={link.route}
                  className="flex gap-4 items-center p-4 text-light-2 hover:text-white">
                  {renderIcon(link, isActive)}
                  <span className={`${isActive ? "text-white" : "text-light-2"}`}>
                    {link.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Logout button with proper spacing and hover effect */}
      <div className="mt-auto pt-4 border-t border-dark-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 p-4 text-light-2 hover:text-white hover:bg-primary-500 transition-colors"
          onClick={(e) => handleSignOut(e)}>
          <img src="/assets/icons/logout.svg" alt="logout" className="w-5 h-5" />
          <p className="small-medium lg:base-medium">Logout</p>
        </Button>
      </div>
    </nav>
  );
};

export default LeftSidebar;