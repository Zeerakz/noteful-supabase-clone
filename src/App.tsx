
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayoutWithSidebar } from "@/components/layout/AppLayoutWithSidebar";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import NotFound from "./pages/NotFound";
import { PageEditor } from "./pages/PageEditor";
import { WorkspacePage } from "./pages/WorkspacePage";
import { TemplatesPage } from "./pages/TemplatesPage";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayoutWithSidebar>
                        <Index />
                      </AppLayoutWithSidebar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspace/:workspaceId"
                  element={
                    <ProtectedRoute>
                      <AppLayoutWithSidebar>
                        <WorkspacePage />
                      </AppLayoutWithSidebar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspace/:workspaceId/templates"
                  element={
                    <ProtectedRoute>
                      <AppLayoutWithSidebar>
                        <TemplatesPage />
                      </AppLayoutWithSidebar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workspace/:workspaceId/page/:pageId"
                  element={
                    <ProtectedRoute>
                      <PageEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </QueryClientProvider>
  );
}

export default App;
