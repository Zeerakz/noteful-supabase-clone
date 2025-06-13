
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

export function Register() {
  const { user, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is already authenticated, redirect to main app
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Show auth form for unauthenticated users (register mode)
  return <AuthForm mode="register" />;
}

export default Register;
