
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { Toaster } from '@/components/ui/toaster';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthForm } from '@/components/auth/AuthForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { WorkspaceList } from '@/components/workspaces/WorkspaceList';
import { WorkspaceView } from '@/components/workspaces/WorkspaceView';
import { WorkspaceSettingsView } from '@/components/workspaces/WorkspaceSettingsView';
import { PageEditor } from '@/pages/PageEditor';
import { PageView } from '@/pages/PageView';
import { cleanupRealtimeManager } from '@/hooks/useRealtimeManager';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Cleanup realtime connections when app unmounts
  useEffect(() => {
    return () => {
      cleanupRealtimeManager();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AnalyticsProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Auth routes */}
                  <Route path="/auth" element={<AuthForm />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <WorkspaceList />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/workspace/:workspaceId" element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout>
                          <WorkspaceView />
                        </AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/workspace/:workspaceId/settings" element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <AppLayout>
                          <WorkspaceSettingsViewWrapper />
                        </AppLayout>
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/workspace/:workspaceId/page/:pageId/edit" element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <PageEditor />
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/workspace/:workspaceId/page/:pageId" element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <PageView />
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/page/:pageId" element={
                    <ProtectedRoute>
                      <RouteErrorBoundary>
                        <PageView />
                      </RouteErrorBoundary>
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </AuthProvider>
        </AnalyticsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Wrapper component to extract workspaceId from URL params
function WorkspaceSettingsViewWrapper() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  
  if (!workspaceId) {
    return <Navigate to="/" replace />;
  }
  
  return <WorkspaceSettingsView workspaceId={workspaceId} />;
}

export default App;
