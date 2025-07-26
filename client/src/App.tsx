import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import { Header } from "@/components/Header";
import Dashboard from "@/pages/Dashboard";
import Menu1 from "@/pages/Menu1";
import Menu2 from "@/pages/Menu2";
import Menu4 from "@/pages/Menu4";
import Admin from "@/pages/Admin";
import Settings from "@/pages/Settings";
import RequestForms from "@/pages/settings/RequestForms";
import ApprovalPaths from "@/pages/settings/ApprovalPaths";
import Permissions from "@/pages/settings/Permissions";
import NotFound from "@/pages/not-found";

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/menu1" component={Menu1} />
        <Route path="/menu2" component={Menu2} />
        <Route path="/menu4" component={Menu4} />
        <Route path="/admin" component={Admin} />
        <Route path="/settings" component={Settings} />
        <Route path="/settings/request-forms" component={RequestForms} />
        <Route path="/settings/approval-paths" component={ApprovalPaths} />
        <Route path="/settings/permissions" component={Permissions} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
