import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncProfile = async (user: User) => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        const authAvatarUrl = user.user_metadata?.avatar_url;
        
        if (authAvatarUrl && (!profile || profile.avatar_url !== authAvatarUrl)) {
          console.log('🔄 Syncing avatar_url for user:', user.id);
          await supabase
            .from('profiles')
            .update({ avatar_url: authAvatarUrl, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error("Error syncing profile avatar:", error);
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (_event === 'SIGNED_IN' && session?.user) {
        syncProfile(session.user);
      }
    });

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        syncProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log('Attempting custom sign up for:', email);

    // Step 1: Call our new edge function to create a user that is already confirmed.
    const { data: signupData, error: signupError } = await supabase.functions.invoke('custom-signup', {
      body: { email, password }
    });

    if (signupError) {
      console.error('Custom signup function invocation error:', signupError);
      return { error: signupError, needsConfirmation: false };
    }

    if (signupData.error) {
      console.error('Custom signup function execution error:', signupData.error);
      return { error: new Error(signupData.error), needsConfirmation: false };
    }
    
    console.log('Custom signup successful, user created. Now signing in automatically.');

    // Step 2: Sign in the newly created user.
    const { error: signinError } = await signIn(email, password);

    if (signinError) {
      console.error('Auto sign-in after custom signup failed:', signinError);
      // This is an edge case. The account is created, but login fails.
      // We can inform the user to try logging in manually.
      return { error: new Error('Account created successfully. Please sign in to continue.'), needsConfirmation: true };
    }
    
    console.log('Auto sign-in successful.');
    // The user is created and signed in, no confirmation needed.
    return { error: null, needsConfirmation: false };
  };

  const resendConfirmation = async (email: string) => {
    console.log('Resending confirmation for:', email);
    
    const redirectUrl = window.location.origin;
    console.log('Resend redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('Resend confirmation error:', error);
    } else {
      console.log('Confirmation email resent successfully');
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out');
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
