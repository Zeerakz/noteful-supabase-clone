
import { supabase } from '@/integrations/supabase/client';

export class DatabasePropertyService {
  static async createPropertyValue(pageId: string, propertyId: string, value: string, userId: string) {
    const { data, error } = await supabase.from('property_values').insert({
      page_id: pageId,
      property_id: propertyId,
      value: value,
      created_by: userId,
    }).select().single();
    return { data, error: error ? error.message : null };
  }
}
