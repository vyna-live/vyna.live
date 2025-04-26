import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Livestream from "@/pages/Livestream";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function Router() {
  // Track if the app is in a loading state
  const [isLoading, setIsLoading] = useState(true);

  // Simulate a brief loading period
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
        <div className="font-bold text-xl text-white mb-4">Vyna.live</div>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <div className="mt-4 text-gray-300">Loading application...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/livestream" component={Livestream} />
      <Route path="/chat" component={Home} />
      <Route path="/research" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
