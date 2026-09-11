import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly }) => {
  const { user, loading, userData } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002A1A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with the current path for post-login redirect
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (adminOnly && userData?.role !== 'admin') {
    const secretUnlocked = localStorage.getItem("admin_secret_unlocked") === "true";
    if (!secretUnlocked) {
      // If admin role is required but user is not admin and secret not used, redirect to home
      console.warn("Unauthorized access attempt to admin area by:", user?.email || "anonymous");
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
