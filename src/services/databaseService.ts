import { supabase } from '@/integrations/supabase/client';
import { Database, DatabaseCreateRequest } from '@/types/database';
import { DatabaseCoreService } from './database/databaseCoreService';
import { DatabasePageService } from './database/databasePageService';
import { DatabaseFieldService } from './database/databaseFieldService';
import { PropertyValueService } from '@/services/propertyValueService';

export class DatabaseService {
  // Database CRUD operations
  static async fetchDatabases(workspaceId: string) {
    return DatabaseCoreService.fetchDatabases(workspaceId);
  }

  static async getDatabase(databaseId: string) {
    const { data, error } = await supabase
      .from('databases')
      .select('*')
      .eq('id', databaseId)
      .single();

    return { data, error: error?.message };
  }

  static async createDatabase(workspaceId: string, userId: string, request: DatabaseCreateRequest) {
    return DatabaseCoreService.createDatabase(workspaceId, userId, request);
  }

  static async updateDatabase(databaseId: string, updates: Partial<Pick<Database, 'name' | 'description' | 'icon'>>) {
    const { data, error } = await supabase
      .from('databases')
      .update(updates)
      .eq('id', databaseId)
      .select()
      .single();

    return { data, error: error?.message };
  }

  static async deleteDatabase(databaseId: string) {
    return DatabaseCoreService.deleteDatabase(databaseId);
  }

  // Database field operations
  static async fetchDatabaseFields(databaseId: string) {
    const { data, error } = await supabase
      .from('database_properties')
      .select('*')
      .eq('database_id', databaseId)
      .order('pos', { ascending: true });
    
    return { data, error: error?.message };
  }

  static async createDatabaseField(databaseId: string, userId: string, field: any) {
    return DatabaseFieldService.createDatabaseField(databaseId, userId, field);
  }

  static async updateDatabaseField(fieldId: string, updates: any) {
    return DatabaseFieldService.updateDatabaseField(fieldId, updates);
  }

  static async deleteDatabaseField(fieldId: string) {
    return DatabaseFieldService.deleteDatabaseField(fieldId);
  }

  // Database page operations
  static async createDatabasePage(databaseId: string, workspaceId: string, userId: string, title: string) {
    return DatabasePageService.createDatabasePage(databaseId, workspaceId, userId, title);
  }

  // Page property operations
  static async createPageProperty(pageId: string, propertyId: string, value: string, userId: string) {
    return PropertyValueService.upsertPropertyValue(pageId, propertyId, value, userId);
  }
}
