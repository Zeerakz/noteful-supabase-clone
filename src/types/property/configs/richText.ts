
import { BasePropertyConfig } from '../base';

export interface RichTextPropertyConfig extends BasePropertyConfig {
  allowedFormats?: ('bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'heading' | 'list' | 'quote')[];
  maxLength?: number;
  enableMentions?: boolean;
  enableHashtags?: boolean;
}
