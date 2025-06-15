
export type PresenceActivity = 'editing' | 'commenting' | 'viewing';

export interface CursorPosition {
  x: number;
  y: number;
  blockId?: string;
}

export interface PresenceData {
  id: string;
  page_id: string;
  user_id: string;
  cursor?: CursorPosition | null;
  activity: PresenceActivity;
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveUser {
  user_id: string;
  cursor?: CursorPosition;
  activity: PresenceActivity;
  last_heartbeat: string;
}
