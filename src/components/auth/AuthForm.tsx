
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, RefreshCw, AlertCircle } from 'lucide-react';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const { signIn, signUp, resendConfirmation } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Sign in error details:', error);
      if (error.message.includes('Email not confirmed') || error.message.includes('signup_disabled')) {
        setNeedsConfirmation(true);
        setConfirmationEmail(email);
        toast({
          title: "Email confirmation required",
          description: "Please check your email and click the confirmation link to complete your registration.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: "Successfully signed in!",
      });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, needsConfirmation: needsConf } = await signUp(email, password);
    
    if (error) {
      console.error('Sign up error details:', error);
      if (error.message.includes('already registered')) {
        toast({
          title: "Account already exists",
          description: "This email is already registered. Try signing in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error signing up",
          description: error.message,
          variant: "destructive",
        });
      }
    } else if (needsConf) {
      setNeedsConfirmation(true);
      setConfirmationEmail(email);
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link. Please check your email (including spam folder) and click the link to complete your registration.",
      });
    } else {
      toast({
        title: "Success",
        description: "Account created and signed in!",
      });
    }
    
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    
    const { error } = await resendConfirmation(confirmationEmail);
    
    if (error) {
      console.error('Resend error details:', error);
      toast({
        title: "Error resending email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent",
        description: "We've sent another confirmation email. Please check your inbox and spam folder.",
      });
    }
    
    setResendLoading(false);
  };

  if (needsConfirmation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to {confirmationEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please check your email (including spam folder) and click the confirmation link to complete your registration.
                <br /><br />
                <strong>Current site URL:</strong> {window.location.origin}
                <br />
                Make sure this matches your Supabase redirect URL settings.
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Didn't receive the email?
              </p>
              <Button 
                variant="outline" 
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend confirmation email'
                )}
              </Button>
            </div>
            
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setNeedsConfirmation(false);
                  setConfirmationEmail('');
                }}
                className="text-sm"
              >
                Back to sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Planna</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
