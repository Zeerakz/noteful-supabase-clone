
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { initializePropertyRegistry } from "./services/propertyTypeRegistry";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";
import { PageView } from "./pages/PageView";
import { DatabasePage } from "./pages/DatabasePage";

// Initialize property registry early
initializePropertyRegistry();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/workspace/:workspaceId" element={<Workspace />} />
            <Route path="/workspace/:workspaceId/page/:pageId" element={<PageView />} />
            <Route path="/workspace/:workspaceId/database/:databaseId" element={<DatabasePage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
