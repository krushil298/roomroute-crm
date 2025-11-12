import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Deals from "@/pages/deals";
import Pipeline from "@/pages/pipeline";
import ActiveAccounts from "@/pages/active-accounts";
import Templates from "@/pages/templates";
import Calculator from "@/pages/calculator";
import Import from "@/pages/import";
import Settings from "@/pages/settings";
import Reports from "@/pages/reports";
import Team from "@/pages/team";
import AdminManagement from "@/pages/admin-management";
import AdminOverview from "@/pages/admin-overview";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Onboarding from "@/pages/onboarding";
import SwitchUser from "@/pages/switch-user";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import logoUrl from "@assets/image_1762307821152.png";

function AuthenticatedRouter() {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect anyway
      window.location.href = "/login";
    }
  };

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/deals" component={Deals} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/active-accounts" component={ActiveAccounts} />
      <Route path="/templates" component={Templates} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/import" component={Import} />
      <Route path="/reports" component={Reports} />
      <Route path="/team" component={Team} />
      <Route path="/admin" component={AdminManagement} />
      <Route path="/admin-overview" component={AdminOverview} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check if we're on public pages (accessible without auth)
  const publicPaths = ["/switch-user", "/login", "/signup", "/forgot-password"];
  const currentPath = window.location.pathname;

  if (publicPaths.includes(currentPath) || currentPath.startsWith("/reset-password/")) {
    if (currentPath === "/switch-user") return <SwitchUser />;
    if (currentPath === "/login") return <Login />;
    if (currentPath === "/signup") return <Signup />;
    if (currentPath === "/forgot-password") return <ForgotPassword />;
    if (currentPath.startsWith("/reset-password/")) return <ResetPassword />;
  }

  // Show landing page while loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return <Landing />;
  }

  // Super admins don't need an organization - skip onboarding
  // Regular users: Only show onboarding if they have NO organization membership
  // This allows invited users to skip onboarding and go straight to their organization
  const needsOnboarding = user?.role !== "super_admin" && 
                          !user?.organizationId && 
                          !(user as any)?.hasOrganizationMembership;
  
  if (needsOnboarding) {
    return <Onboarding />;
  }

  // Show authenticated app
  const handleLogout = async () => {
    // Store last logged-in user info for switch user screen
    if (user) {
      const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.email || "User";

      localStorage.setItem("lastLoggedInUser", JSON.stringify({
        email: user.email || "",
        name: userName
      }));
    }

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect anyway
      window.location.href = "/login";
    }
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
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <OrganizationSwitcher />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <img
                src={logoUrl}
                alt="RoomRoute Logo"
                className="h-6 w-auto md:h-8"
                data-testid="img-header-logo"
              />
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm text-muted-foreground" data-testid="text-user-name">
                  {user?.firstName || user?.email || "User"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline text-sm">Logout</span>
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
