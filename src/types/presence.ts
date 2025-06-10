
export interface PresenceData {
  id: string;
  page_id: string;
  user_id: string;
  cursor?: {
    x: number;
    y: number;
    blockId?: string;
  };
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveUser {
  user_id: string;
  cursor?: {
    x: number;
    y: number;
    blockId?: string;
  };
  last_heartbeat: string;
}

export interface CursorPosition {
  x: number;
  y: number;
  blockId?: string;
}
