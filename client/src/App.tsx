import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Deals from "@/pages/deals";
import Pipeline from "@/pages/pipeline";
import Templates from "@/pages/templates";
import Calculator from "@/pages/calculator";
import Import from "@/pages/import";
import Settings from "@/pages/settings";
import Reports from "@/pages/reports";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function AuthenticatedRouter() {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/deals" component={Deals} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/templates" component={Templates} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/import" component={Import} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show landing page while loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return <Landing />;
  }

  // Super admins don't need an organization - skip onboarding
  // Regular users need an organization
  if (!user?.organizationId && user?.role !== "super_admin") {
    return <Onboarding />;
  }

  // Show authenticated app
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground" data-testid="text-user-name">
                  {user.firstName || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <AuthenticatedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
