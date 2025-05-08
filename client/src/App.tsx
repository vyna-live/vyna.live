import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Livestream from "@/pages/Livestream";
import Dashboard from "@/pages/Dashboard";
import ViewStream from "@/pages/ViewStream";
import JoinStream from "@/pages/JoinStream";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import VynaAIChat from "@/pages/VynaAIChat";
import Notepad from "@/pages/Notepad";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/auth" component={Auth} />
      <Route path="/livestream">
        <ProtectedRoute>
          <Livestream />
        </ProtectedRoute>
      </Route>
      <Route path="/chat" component={Home} />
      <Route path="/ai-chat" component={VynaAIChat} />
      <Route path="/notepad" component={Notepad} />
      <Route path="/join-stream" component={JoinStream} />
      <Route path="/view-stream/:streamId" component={ViewStream} />
      <Route path="/view/:channelName" component={ViewStream} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
