
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppLayoutWithSidebar } from "@/components/layout/AppLayoutWithSidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { PageEditor } from "@/pages/PageEditor";
import { DatabasePage } from "@/pages/DatabasePage";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { NotFound } from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId" element={
                <ProtectedRoute>
                  <AppLayoutWithSidebar>
                    <WorkspacePage />
                  </AppLayoutWithSidebar>
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/page/:pageId" element={
                <ProtectedRoute>
                  <PageEditor />
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/database/:databaseId" element={
                <ProtectedRoute>
                  <DatabasePage />
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/templates" element={
                <ProtectedRoute>
                  <AppLayoutWithSidebar>
                    <TemplatesPage />
                  </AppLayoutWithSidebar>
                </ProtectedRoute>
              } />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </AuthProvider>
      </AnalyticsProvider>
    </QueryClientProvider>
  );
};

export default App;
