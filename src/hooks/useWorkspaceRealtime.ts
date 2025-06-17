// This file is deprecated in favor of useRealtimeManager
// Keeping it for backwards compatibility but it should not be used
// All realtime functionality should use useRealtimeManager instead

export function useWorkspaceRealtime() {
  console.warn('useWorkspaceRealtime is deprecated. Use useRealtimeManager instead.');
  
  return {
    isConnected: false
  };
}
