
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { Login } from "@/pages/Login";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppLayoutWithSidebar } from "@/components/layout/AppLayoutWithSidebar";
import { WorkspaceList } from "@/components/workspaces/WorkspaceList";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { PageEditor } from "@/pages/PageEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useSessionTracking();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppLayoutWithSidebar>
                <WorkspaceList />
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
          path="/workspace/:workspaceId/page/:pageId" 
          element={
            <ProtectedRoute>
              <PageEditor />
            </ProtectedRoute>
          } 
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AnalyticsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AnalyticsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
