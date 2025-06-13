
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WorkspaceList } from '@/components/workspaces/WorkspaceList';

const Index = () => {
  return (
    <ProtectedRoute>
      <WorkspaceList />
    </ProtectedRoute>
  );
};

export default Index;
