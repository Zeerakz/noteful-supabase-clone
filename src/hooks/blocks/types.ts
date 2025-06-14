
import { Block } from '@/types/block';

export type { Block };

export type BlockCreateParams = Partial<Omit<Block, 'id' | 'created_time' | 'last_edited_time'>>;

export type BlockUpdateParams = Partial<Omit<Block, 'id' | 'created_time' | 'last_edited_time' | 'created_by' | 'workspace_id'>>;

export interface BlockOperationResult<T> {
  data: T | null;
  error: string | null;
}
