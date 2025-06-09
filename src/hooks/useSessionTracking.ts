
import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useAuth } from '@/contexts/AuthContext';

export function useSessionTracking() {
  const { track, identify } = useAnalytics();
  const { user } = useAuth();
  const sessionStarted = useRef(false);

  useEffect(() => {
    // Emit session_start only once per page load
    if (!sessionStarted.current) {
      track('session_start', {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer || null,
      });
      sessionStarted.current = true;
    }
  }, [track]);

  useEffect(() => {
    // Identify user when authenticated
    if (user) {
      identify(user.id, {
        email: user.email,
        created_at: user.created_at,
      });
    }
  }, [user, identify]);
}
