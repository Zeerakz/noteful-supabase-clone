
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/contexts/AuthContext';
import { useContext } from 'react';

export class PropertyInheritanceService {
  static async applyInheritance(pageId: string, databaseId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.rpc('apply_properties_to_page', {
        p_page_id: pageId,
        p_database_id: databaseId,
        p_user_id: userId,
      });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to apply database properties' 
      };
    }
  }
}
