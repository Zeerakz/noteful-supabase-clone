
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspaceList } from '@/components/workspaces/WorkspaceList';
import { CoreNavigationModel } from '@/components/navigation/CoreNavigationModel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { user, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show workspaces for authenticated users with navigation model
  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="workspaces" className="w-full">
        <div className="border-b">
          <div className="container mx-auto">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="workspaces">My Workspaces</TabsTrigger>
              <TabsTrigger value="navigation">Navigation Model</TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="workspaces" className="container mx-auto py-6">
          <WorkspaceList />
        </TabsContent>
        
        <TabsContent value="navigation" className="py-6">
          <CoreNavigationModel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
