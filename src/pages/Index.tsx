
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspaceList } from '@/components/workspaces/WorkspaceList';

const Index = () => {
  const { user, loading } = useAuth();

  console.log('🏠 Index component - Auth state:', { user: !!user, loading });

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    console.log('🔒 User not authenticated, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ User authenticated, showing workspace list');
  // Show workspaces for authenticated users
  return <WorkspaceList />;
};

export default Index;
