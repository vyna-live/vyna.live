import { toast } from "@/components/ui/use-toast";

/**
 * Helper function to show a login required notification
 * 
 * @param message Custom message to display (optional)
 */
export function showLoginRequiredToast(message?: string) {
  toast({
    title: "Login Required",
    description: message || "You need to be logged in to use this feature",
    variant: "destructive",
  });
}