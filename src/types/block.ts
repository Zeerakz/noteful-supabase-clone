
export type BlockType =
  | 'page'
  | 'database'
  | 'text'
  | 'image'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'todo_item'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'toggle_list'
  | 'code'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'two_column'
  | 'table'
  | 'embed'
  | 'file_attachment';

export interface Block {
  id: string;
  workspace_id: string;
  type: BlockType;
  parent_id: string | null;
  properties: Record<string, any>;
  content: Record<string, any> | null;
  pos: number;
  created_time: string;
  last_edited_time: string;
  created_by: string | null;
  last_edited_by: string | null;
  archived: boolean;
  in_trash: boolean;
}
