import { Switch, Route, Link, useLocation } from "wouter";
import { Users, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import VoiceLab from "@/pages/voice-lab";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Virtual Friends Platform
          </h1>
          
          <div className="flex gap-4">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Friends Manager
              </Button>
            </Link>
            
            <Link href="/voice-lab">
              <Button 
                variant={location === "/voice-lab" ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Voice Manager
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/voice-lab" component={VoiceLab} />
        <Route component={NotFound} />
      </Switch>
    </div>
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
