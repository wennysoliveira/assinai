import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import Subscriptions from "@/pages/subscriptions";
import Invoices from "@/pages/invoices";
import Settings from "@/pages/settings";
import Services from "@/pages/services";
import Login from "@/pages/login";
import Home from "@/pages/home";
import { useAuth } from "@/hooks/use-auth";
import { applyStoredThemeColors } from "@/hooks/use-theme-color";

applyStoredThemeColors();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function HomeOrDashboard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Redirect to="/dashboard" /> : <Home />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

function Routes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={HomeOrDashboard} />
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute><Customers /></ProtectedRoute>
      </Route>
      <Route path="/services">
        <ProtectedRoute><Services /></ProtectedRoute>
      </Route>
      <Route path="/subscriptions">
        <ProtectedRoute><Subscriptions /></ProtectedRoute>
      </Route>
      <Route path="/invoices">
        <ProtectedRoute><Invoices /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>
      <Route>
        <ProtectedRoute><NotFound /></ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Routes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
