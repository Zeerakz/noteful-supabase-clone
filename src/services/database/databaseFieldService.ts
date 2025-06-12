
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField } from '@/types/database';

export class DatabaseFieldService {
  static async fetchDatabaseFields(databaseId: string): Promise<{ data: DatabaseField[] | null; error: string | null }> {
    try {
      console.log('Fetching fields for database:', databaseId);
      
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('database_id', databaseId)
        .order('pos', { ascending: true });

      if (error) {
        console.error('Supabase error fetching fields:', error);
        throw error;
      }

      console.log('Fields fetched successfully:', data);
      return { data: (data || []) as DatabaseField[], error: null };
    } catch (err) {
      console.error('Error in fetchDatabaseFields:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch database fields' 
      };
    }
  }

  static async createDatabaseField(
    databaseId: string,
    userId: string,
    field: Omit<DatabaseField, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'database_id'>
  ): Promise<{ data: DatabaseField | null; error: string | null }> {
    try {
      console.log('Creating field for database:', databaseId);
      
      const { data, error } = await supabase
        .from('fields')
        .insert([
          {
            database_id: databaseId,
            created_by: userId,
            ...field
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating field:', error);
        throw error;
      }

      console.log('Field created successfully:', data);
      return { data: data as DatabaseField, error: null };
    } catch (err) {
      console.error('Error in createDatabaseField:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create database field' 
      };
    }
  }

  static async updateDatabaseField(
    fieldId: string,
    updates: Partial<Omit<DatabaseField, 'id' | 'created_at' | 'created_by' | 'database_id'>>
  ): Promise<{ data: DatabaseField | null; error: string | null }> {
    try {
      console.log('Updating field:', fieldId);
      
      const { data, error } = await supabase
        .from('fields')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', fieldId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating field:', error);
        throw error;
      }

      console.log('Field updated successfully:', data);
      return { data: data as DatabaseField, error: null };
    } catch (err) {
      console.error('Error in updateDatabaseField:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update database field' 
      };
    }
  }

  static async deleteDatabaseField(fieldId: string): Promise<{ error: string | null }> {
    try {
      console.log('Deleting field:', fieldId);
      
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', fieldId);

      if (error) {
        console.error('Supabase error deleting field:', error);
        throw error;
      }

      console.log('Field deleted successfully');
      return { error: null };
    } catch (err) {
      console.error('Error in deleteDatabaseField:', err);
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete database field' 
      };
    }
  }
}
