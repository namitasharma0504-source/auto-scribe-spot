import { ReactNode, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/auth" }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hasCheckedAuth = useRef(false);

  // Show nothing while loading to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only redirect if we've confirmed there's no user after loading completes
  if (!user) {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
