
import { supabase } from '@/integrations/supabase/client';
import { DatabaseField } from '@/types/database';

export class DatabaseFieldService {
  static async fetchDatabaseFields(databaseId: string) {
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('database_id', databaseId)
      .order('pos', { ascending: true });

    return { data, error: error?.message };
  }

  static async createDatabaseField(databaseId: string, userId: string, field: Partial<DatabaseField>) {
    // Get the next position
    const { data: existingFields } = await supabase
      .from('fields')
      .select('pos')
      .eq('database_id', databaseId)
      .order('pos', { ascending: false })
      .limit(1);

    const nextPos = existingFields && existingFields.length > 0 ? existingFields[0].pos + 1 : 0;

    const { data, error } = await supabase
      .from('fields')
      .insert({
        database_id: databaseId,
        name: field.name,
        type: field.type,
        settings: field.settings || {},
        pos: nextPos,
        created_by: userId
      })
      .select()
      .single();

    return { data, error: error?.message };
  }

  static async updateDatabaseField(fieldId: string, updates: Partial<DatabaseField>) {
    const { data, error } = await supabase
      .from('fields')
      .update({
        name: updates.name,
        type: updates.type,
        settings: updates.settings,
        pos: updates.pos
      })
      .eq('id', fieldId)
      .select()
      .single();

    return { data, error: error?.message };
  }

  static async deleteDatabaseField(fieldId: string) {
    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', fieldId);

    return { error: error?.message };
  }
}
