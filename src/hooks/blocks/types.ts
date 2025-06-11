
export interface Block {
  id: string;
  page_id: string;
  parent_block_id?: string;
  type: string;
  content: any;
  pos: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BlockCreateParams {
  type: string;
  content?: any;
  parentBlockId?: string;
}

export interface BlockUpdateParams {
  type?: string;
  content?: any;
  pos?: number;
  parent_block_id?: string;
}

export interface BlockOperationResult<T = any> {
  data: T | null;
  error: string | null;
}
