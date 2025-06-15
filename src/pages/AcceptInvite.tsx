
```typescript
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { InvitationService } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<'loading' | 'idle' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (authLoading) {
      setStatus('loading');
      return;
    }
    
    if (!token) {
      setError('No invitation token provided.');
      setStatus('error');
      return;
    }

    if (user) {
      setStatus('loading');
      InvitationService.acceptInvitation(token)
        .then(({ data, error }) => {
          if (error) {
            setError(error);
            setStatus('error');
            toast({ title: 'Error accepting invitation', description: error, variant: 'destructive' });
          } else if (data && data.success) {
            setStatus('success');
            toast({ title: 'Success!', description: data.message });
            navigate(`/workspace/${data.workspace_id}`);
          } else {
            const failureMessage = data?.message || 'Could not accept invitation.';
            setError(failureMessage);
            setStatus('error');
            toast({ title: 'Failed to join workspace', description: failureMessage, variant: 'destructive' });
          }
        });
    } else {
      setStatus('idle');
    }
  }, [user, authLoading, token, navigate, toast]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Processing invitation...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accept Your Invitation</CardTitle>
            <CardDescription>You've been invited to join a workspace. Please sign in or create an account to accept. After signing in, please return to this page to complete the process.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">Create an Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Invitation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || 'An unexpected error occurred.'}</p>
            <Button asChild>
              <Link to="/">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null; // Should be redirected on success or showing a state
}

export default AcceptInvite;
```
