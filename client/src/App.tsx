import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Livestream from "@/pages/Livestream";
import Dashboard from "@/pages/Dashboard";
import ViewStream from "@/pages/ViewStream";
import DirectStream from "@/pages/DirectStream";
import JoinStream from "@/pages/JoinStream";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/livestream" component={Livestream} />
      <Route path="/chat" component={Home} />
      <Route path="/join-stream" component={JoinStream} />
      <Route path="/view-stream/:streamId" component={ViewStream} />
      <Route path="/view/:channelName" component={ViewStream} />
      <Route path="/direct/:code" component={DirectStream} />
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
