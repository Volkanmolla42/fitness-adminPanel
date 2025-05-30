import React, { Suspense} from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import Trainers from "@/pages/trainers";
import Appointments from "@/pages/appointments";
import Services from "@/pages/services";
import Reports from "@/pages/reports";
import Messages from "@/pages/messages";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import ErrorPage from "@/pages/error";
import NotFoundPage from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/contexts/theme-context";
import ErrorBoundary from "@/components/ErrorBoundary";
export function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Yükleniyor..." />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Yükleniyor..." />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/services" element={<Services />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      {/* Catch-all route for 404 - must be the last route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <Suspense fallback={<LoadingSpinner text="Sayfa yükleniyor..." />}>
              <AppRoutes />
            </Suspense>
            <Toaster />
            <Analytics />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
