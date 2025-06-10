
export interface RichTextEditorProps {
  initialContent?: any;
  onBlur: (content: any) => void;
  placeholder?: string;
}

export interface DocumentNode {
  type: string;
  content?: any[];
  attrs?: any;
  text?: string;
  marks?: any[];
}

export interface Document {
  type: 'doc';
  content: DocumentNode[];
}
