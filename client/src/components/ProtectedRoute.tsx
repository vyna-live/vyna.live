import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Wait until auth is checked
    if (!isLoading && !isAuthenticated) {
      // Redirect to auth page with current location as referrer
      navigate(`/auth?referrer=${encodeURIComponent(location)}`);
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
