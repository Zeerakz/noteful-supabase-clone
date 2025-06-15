
import { supabase } from '@/integrations/supabase/client';
import { FieldDependency } from '@/types/database';

export class FieldDependencyService {
  static async fetchFieldDependencies(fieldId: string): Promise<{ data: FieldDependency[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('field_dependencies')
        .select('*')
        .eq('dependent_property_id', fieldId);

      if (error) throw error;
      return { data: (data || []) as FieldDependency[], error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch field dependencies' 
      };
    }
  }

  static async createFieldDependency(
    sourcePropertyId: string,
    dependentPropertyId: string
  ): Promise<{ data: FieldDependency | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('field_dependencies')
        .insert([
          {
            source_property_id: sourcePropertyId,
            dependent_property_id: dependentPropertyId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data: data as FieldDependency, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create field dependency' 
      };
    }
  }

  static async deleteFieldDependency(dependencyId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('field_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete field dependency' 
      };
    }
  }

  static async recalculateFormulaField(
    fieldId: string,
    pageId: string
  ): Promise<{ data: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('recalculate_formula_field', {
        field_id: fieldId,
        page_id: pageId
      });

      if (error) throw error;
      return { data: data as string, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to recalculate formula field' 
      };
    }
  }

  static async recalculateRollupField(
    fieldId: string,
    pageId: string
  ): Promise<{ data: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('recalculate_rollup_field', {
        field_id: fieldId,
        page_id: pageId
      });

      if (error) throw error;
      return { data: data as string, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to recalculate rollup field' 
      };
    }
  }
}
