
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const routeErrorFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Page Error</h1>
          <p className="text-muted-foreground">
            There was an error loading this page. Please try navigating elsewhere.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleGoBack} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <Button onClick={handleGoHome} variant="outline" className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={routeErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
