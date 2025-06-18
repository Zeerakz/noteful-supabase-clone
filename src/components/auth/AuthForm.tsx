
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, RefreshCw, AlertCircle, FileText } from 'lucide-react';

export function AuthForm({ defaultTab = 'signin' }: { defaultTab?: 'signin' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const { signIn, signUp, resendConfirmation } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSuccessfulAuth = () => {
    const storedToken = localStorage.getItem('pending_invitation_token');
    if (storedToken) {
      localStorage.removeItem('pending_invitation_token');
      navigate(`/accept-invite?token=${storedToken}`);
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Sign in error details:', error);
      if (error.message.includes('Email not confirmed')) {
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
      handleSuccessfulAuth();
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
      handleSuccessfulAuth();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Check your email</CardTitle>
            <CardDescription className="text-gray-600">
              We've sent a confirmation link to <span className="font-medium text-gray-900">{confirmationEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Please check your email (including spam folder) and click the confirmation link to complete your registration.
                <br /><br />
                <strong>Current site URL:</strong> {window.location.origin}
                <br />
                Make sure this matches your Supabase redirect URL settings.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
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
                className="text-sm text-gray-600 hover:text-gray-900"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome to Planna
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Your collaborative workspace awaits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="signin" 
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Create a password (min. 6 characters)"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
