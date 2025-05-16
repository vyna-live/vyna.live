import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

/**
 * Custom hook for displaying login requirement notifications
 * with a consistent style and a login button
 */
export function useLoginNotification() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  /**
   * Show a notification when login is required with a login button
   * @param message Optional custom message (defaults to "Please log in to continue")
   */
  const showLoginRequiredNotification = (message: string = "Please log in to continue") => {
    toast({
      title: 'Authentication Required',
      description: message,
      variant: 'destructive',
      action: (
        <button 
          className="bg-[#DCC5A2] text-[#121212] px-3 py-1 rounded-md text-xs font-medium"
          onClick={() => setLocation("/auth")}
        >
          Log in
        </button>
      ),
    });
  };

  return { showLoginRequiredNotification };
}