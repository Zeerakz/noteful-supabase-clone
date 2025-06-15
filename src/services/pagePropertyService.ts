
import { supabase } from '@/integrations/supabase/client';
import { PageProperty } from '@/types/database';

export class PagePropertyService {
  static async fetchPageProperties(pageId: string): Promise<{ data: PageProperty[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('page_properties')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: (data || []) as PageProperty[], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch page properties' 
      };
    }
  }

  static async upsertPageProperty(
    pageId: string,
    fieldId: string,
    value: string,
    userId: string,
    options?: {
      computedValue?: string;
      visibilitySetting?: 'always_show' | 'always_hide' | 'show_when_not_empty';
      fieldOrder?: number;
      metadata?: any;
    }
  ): Promise<{ data: PageProperty | null; error: string | null }> {
    try {
      const updateData: any = {
        page_id: pageId,
        field_id: fieldId,
        value,
        created_by: userId,
        updated_at: new Date().toISOString(),
      };

      // Include optional values if provided
      if (options) {
        if (options.computedValue !== undefined) {
          updateData.computed_value = options.computedValue;
        }
        if (options.visibilitySetting) {
          updateData.visibility_setting = options.visibilitySetting;
        }
        if (options.fieldOrder !== undefined) {
          updateData.field_order = options.fieldOrder;
        }
        if (options.metadata) {
          updateData.metadata = options.metadata;
        }
      }

      const { data, error } = await supabase
        .from('page_properties')
        .upsert(
          updateData,
          { 
            onConflict: 'page_id,field_id',
            ignoreDuplicates: false 
          }
        )
        .select()
        .single();

      if (error) throw error;
      return { data: data as PageProperty, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update page property' 
      };
    }
  }

  static async updateComputedValue(
    pageId: string,
    fieldId: string,
    computedValue: string
  ): Promise<{ data: PageProperty | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('page_properties')
        .update({ computed_value: computedValue })
        .eq('page_id', pageId)
        .eq('field_id', fieldId)
        .select()
        .single();

      if (error) throw error;
      return { data: data as PageProperty, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update computed value' 
      };
    }
  }

  static async deletePageProperty(
    pageId: string,
    fieldId: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('page_properties')
        .delete()
        .eq('page_id', pageId)
        .eq('field_id', fieldId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete page property' 
      };
    }
  }

  static async deleteAllPageProperties(pageId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('page_properties')
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
