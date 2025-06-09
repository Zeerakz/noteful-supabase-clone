
import React, { createContext, useContext, useEffect } from 'react';
import posthog from 'posthog-js';

interface AnalyticsContextType {
  track: (eventName: string, properties?: Record<string, any>) => void;
  identify: (userId: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog
    if (typeof window !== 'undefined') {
      // Use environment variable for PostHog API key
      const posthogKey = import.meta.env.VITE_POSTHOG_API_KEY;
      const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
      
      if (posthogKey) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          loaded: (posthog) => {
            if (import.meta.env.DEV) {
              console.log('PostHog initialized');
            }
          }
        });
      } else {
        console.warn('PostHog API key not found. Set VITE_POSTHOG_API_KEY environment variable.');
      }
    }
  }, []);

  const track = (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture(eventName, properties);
    }
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.identify(userId, properties);
    }
  };

  const value = {
    track,
    identify,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
