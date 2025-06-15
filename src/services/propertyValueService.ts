
import { supabase } from '@/integrations/supabase/client';
import { PropertyValue } from '@/types/database';

export class PropertyValueService {
  static async fetchPropertyValues(pageId: string): Promise<{ data: PropertyValue[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('property_values')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: (data || []) as PropertyValue[], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch page properties' 
      };
    }
  }

  static async upsertPropertyValue(
    pageId: string,
    propertyId: string,
    value: string,
    userId: string,
    options?: {
      computedValue?: string;
    }
  ): Promise<{ data: PropertyValue | null; error: string | null }> {
    try {
      const updateData: any = {
        page_id: pageId,
        property_id: propertyId,
        value,
        created_by: userId,
        updated_at: new Date().toISOString(),
      };

      // Include optional values if provided
      if (options?.computedValue !== undefined) {
        updateData.computed_value = options.computedValue;
      }

      const { data, error } = await supabase
        .from('property_values')
        .upsert(
          updateData,
          { 
            onConflict: 'page_id,property_id',
            ignoreDuplicates: false 
          }
        )
        .select()
        .single();

      if (error) throw error;
      return { data: data as PropertyValue, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update page property' 
      };
    }
  }

  static async updateComputedValue(
    pageId: string,
    propertyId: string,
    computedValue: string
  ): Promise<{ data: PropertyValue | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('property_values')
        .update({ computed_value: computedValue })
        .eq('page_id', pageId)
        .eq('property_id', propertyId)
        .select()
        .single();

      if (error) throw error;
      return { data: data as PropertyValue, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update computed value' 
      };
    }
  }

  static async deletePropertyValue(
    pageId: string,
    propertyId: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('property_values')
        .delete()
        .eq('page_id', pageId)
        .eq('property_id', propertyId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete page property' 
      };
    }
  }

  static async deleteAllPropertyValues(pageId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('property_values')
        .delete()
        .eq('page_id', pageId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete page properties' 
      };
    }
  }
}
