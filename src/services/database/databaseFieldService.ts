import { supabase } from '@/integrations/supabase/client';
import { DatabaseField, FieldType } from '@/types/database';

export class DatabaseFieldService {
  static async fetchDatabaseFields(databaseId: string) {
    return supabase
      .from('fields')
      .select('*')
      .eq('database_id', databaseId)
      .order('pos', { ascending: true });
  }
  
  static async createDatabaseField(databaseId: string, userId: string, field: { name: string; type: FieldType; settings?: any; }) {
    return supabase.from('fields').insert({
      database_id: databaseId,
      name: field.name,
      type: field.type as any,
      settings: field.settings || {},
      created_by: userId,
    }).select().single();
  }

  static async updateDatabaseField(fieldId: string, updates: Partial<DatabaseField>) {
    return supabase.from('fields').update(updates as any).eq('id', fieldId).select().single();
  }

  static async deleteDatabaseField(fieldId: string) {
    return supabase.from('fields').delete().eq('id', fieldId);
  }
}
