
import { supabase } from '@/integrations/supabase/client';
import { PropertyValue } from '@/types/database';

export class PropertyValueService {
  static async fetchPropertyValues(pageId: string) {
    const { data, error } = await supabase
      .from('property_values')
      .select('*')
      .eq('page_id', pageId);
    return { data, error: error ? error.message : null };
  }

  static async upsertPropertyValue(pageId: string, propertyId: string, value: string, userId: string) {
    const { data, error } = await supabase
      .from('property_values')
      .upsert({ page_id: pageId, property_id: propertyId, value, created_by: userId }, { onConflict: 'page_id,property_id' })
      .select()
      .single();
    return { data, error: error ? error.message : null };
  }

  static async deletePropertyValue(pageId: string, propertyId: string) {
    const { error } = await supabase
      .from('property_values')
      .delete()
      .eq('page_id', pageId)
      .eq('property_id', propertyId);
    return { error: error ? error.message : null };
  }

  static async deleteAllPropertyValues(pageId: string) {
    const { error } = await supabase
      .from('property_values')
      .delete()
      .eq('page_id', pageId);
    return { error: error ? error.message : null };
  }
  
  static async updateComputedValue(pageId: string, propertyId: string, computedValue: string) {
    const { data, error } = await supabase
      .from('property_values')
      .update({ computed_value: computedValue })
      .eq('page_id', pageId)
      .eq('property_id', propertyId)
      .select()
      .single();
    return { data: data as PropertyValue | null, error: error ? error.message : null };
  }
}
