import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ToastAction } from "@/components/ui/toast";
import React from "react";

/**
 * Hook to handle the scenario when a user tries to use a feature that requires login
 * 
 * @returns A function that can be called to show a login required notification
 * and optionally redirect to the login page
 */
export function useLoginRequired() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  /**
   * Show a notification that login is required and optionally redirect to login page
   * 
   * @param message Custom message to display (optional)
   * @param redirectToLogin Whether to redirect to the login page (default: false)
   */
  const showLoginRequired = (message?: string, redirectToLogin: boolean = false) => {
    toast({
      title: "Login Required",
      description: message || "You need to be logged in to use this feature",
      variant: "destructive",
      action: redirectToLogin ? (
        <ToastAction altText="Log in" onClick={() => setLocation("/auth")}>
          Log in
        </ToastAction>
      ) : undefined
    });

    if (redirectToLogin) {
      setTimeout(() => {
        setLocation("/auth");
      }, 1500);
    }
  };

  return showLoginRequired;
}