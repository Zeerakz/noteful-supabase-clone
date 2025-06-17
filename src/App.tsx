import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { initializePropertyRegistry } from "./services/propertyTypeRegistry";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { RouteErrorBoundary } from "./components/error/RouteErrorBoundary";
import { errorHandler } from "./utils/errorHandler";
import { blocksQueryClient } from "./lib/queryClient";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import Register from "./pages/Register";
import AcceptInvite from "./pages/AcceptInvite";
import Workspace from "./pages/Workspace";
import { WorkspaceSettings } from "./pages/WorkspaceSettings";
import { PageView } from "./pages/PageView";
import { DatabasePage } from "./pages/DatabasePage";
import NotFound from "./pages/NotFound";

// Initialize property registry early with error handling
try {
  console.log('🚀 Initializing property registry...');
  initializePropertyRegistry();
  console.log('✅ Property registry initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize property registry:', error);
  errorHandler.logError(error as Error, { context: 'property_registry_init' });
}

// Main query client (keeping existing configuration)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        console.log(`Query retry attempt ${failureCount}:`, error);
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        console.log(`Mutation retry attempt ${failureCount}:`, error);
        return failureCount < 2;
      },
    },
  },
});

// Add global error handling for React Query
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.mutation?.state.status === 'error' && event.mutation.state.error) {
    console.error('Mutation error:', event.mutation.state.error);
    errorHandler.logError(event.mutation.state.error as Error, { context: 'react_query_mutation' });
  }
});

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query?.state.status === 'error' && event.query.state.error) {
    console.error('Query error:', event.query.state.error);
    errorHandler.logError(event.query.state.error as Error, { context: 'react_query_query' });
  }
});

// Also add error handling for blocks query client
blocksQueryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.mutation?.state.status === 'error' && event.mutation.state.error) {
    console.error('Blocks mutation error:', event.mutation.state.error);
    errorHandler.logError(event.mutation.state.error as Error, { context: 'blocks_react_query_mutation' });
  }
});

blocksQueryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query?.state.status === 'error' && event.query.state.error) {
    console.error('Blocks query error:', event.query.state.error);
    errorHandler.logError(event.query.state.error as Error, { context: 'blocks_react_query_query' });
  }
});

const App = () => {
  console.log('🏗️ App component rendering...');
  
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      errorHandler.logError(error, { 
        context: 'app_root_error_boundary',
        componentStack: errorInfo.componentStack 
      });
    }}>
      <QueryClientProvider client={queryClient}>
        <QueryClientProvider client={blocksQueryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <RouteErrorBoundary>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/accept-invite" element={<AcceptInvite />} />
                      <Route 
                        path="/workspace/:workspaceId" 
                        element={
                          <ProtectedRoute>
                            <Workspace />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/workspace/:workspaceId/settings" 
                        element={
                          <ProtectedRoute>
                            <WorkspaceSettings />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/workspace/:workspaceId/page/:pageId" 
                        element={
                          <ProtectedRoute>
                            <PageView />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/workspace/:workspaceId/database/:databaseId" 
                        element={
                          <ProtectedRoute>
                            <DatabasePage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </RouteErrorBoundary>
                </BrowserRouter>
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
