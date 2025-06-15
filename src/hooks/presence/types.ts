
import { CursorPosition, ActiveUser, PresenceActivity } from '@/types/presence';

// Type for the raw data from Supabase
export interface SupabasePresenceData {
  id: string;
  page_id: string;
  user_id: string;
  cursor: any; // Json type from Supabase
  activity: PresenceActivity;
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
}

export interface UsePresenceReturn {
  activeUsers: ActiveUser[];
  loading: boolean;
  updateCursorPosition: (x: number, y: number, blockId?: string) => Promise<void>;
  updateActivity: (activity: PresenceActivity) => Promise<void>;
  sendHeartbeat: () => Promise<void>;
}
