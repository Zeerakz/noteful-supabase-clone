
import { Block } from '@/types/block';

export type { Block };

export type BlockCreateParams = Partial<Omit<Block, 'id' | 'created_time' | 'last_edited_time'>>;

export type BlockUpdateParams = Partial<Omit<Block, 'id' | 'workspace_id' | 'created_time' | 'created_by'>>;

export interface BlockOperationResult<T> {
  data: T | null;
  error: string | null;
}
