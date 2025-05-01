import { useLocation } from 'wouter';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import UserProfileDropdown from './UserProfileDropdown';

export default function AuthButton() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Button variant="ghost" className="text-sm" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return <UserProfileDropdown />;
  }

  return (
    <Button
      onClick={() => setLocation('/auth')}
      className="text-sm bg-gradient-to-r from-[#5D1C34] to-[#A67D44] hover:from-[#6D2C44] hover:to-[#B68D54] text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
    >
      <LogIn className="mr-1.5 h-4 w-4" />
      Sign In
    </Button>
  );
}
