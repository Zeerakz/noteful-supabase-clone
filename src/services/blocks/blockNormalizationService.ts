
import { Block } from '@/hooks/blocks/types';

/**
 * Helper function to convert Supabase data to our Block type
 */
export const normalizeBlock = (data: any): Block => ({
  ...data,
  properties: data.properties && typeof data.properties === 'object' ? data.properties : {},
  content: data.content && typeof data.content === 'object' ? data.content : null,
});
