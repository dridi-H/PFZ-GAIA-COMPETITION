import { Outlet, Navigate, useLocation } from "react-router-dom";

import { useUserContext } from "@/context/AuthContext";

export default function AuthLayout() {
  const { isAuthenticated } = useUserContext();
  const location = useLocation();

  // Don't redirect if user is on reset password page
  const isOnResetPasswordPage = location.pathname === '/reset-password';

  return (
    <>
      {isAuthenticated && !isOnResetPasswordPage ? (
        <Navigate to="/" />
      ) : (
        <>
          <section className="flex flex-1 justify-center items-center flex-col py-10">
            <Outlet />
          </section>

          <img
            src="/assets/images/hwita.png"
            alt="logo"
            className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
          />
        </>
      )}
    </>
  );
}