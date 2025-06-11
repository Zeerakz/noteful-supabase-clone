
export interface CrdtTextEditorProps {
  pageId: string;
  blockId: string;
  initialContent?: string;
  onContentChange: (content: any) => void;
  placeholder?: string;
  className?: string;
}

export interface ToolbarPosition {
  top: number;
  left: number;
}

export interface LinkData {
  url: string;
  text: string;
}
