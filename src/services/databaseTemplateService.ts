import { supabase } from '@/integrations/supabase/client';
import { DatabaseTemplate, ViewTemplate, DatabaseTemplateCreateRequest } from '@/types/databaseTemplate';

export const DatabaseTemplateService = {
  async fetchTemplates(workspaceId?: string) {
    let query = supabase
      .from('database_templates')
      .select('*');

    if (workspaceId) {
      query = query.or(`is_system_template.eq.true,workspace_id.eq.${workspaceId}`);
    } else {
      query = query.eq('is_system_template', true);
    }

    const { data, error } = await query.order('is_system_template', { ascending: false })
      .order('category')
      .order('name');

    return { data: data as DatabaseTemplate[], error: error?.message };
  },

  async createTemplate(userId: string, request: DatabaseTemplateCreateRequest) {
    const { data, error } = await supabase
      .from('database_templates')
      .insert({
        ...request,
        created_by: userId,
        is_system_template: false,
      })
      .select()
      .single();

    return { data: data as DatabaseTemplate, error: error?.message };
  },

  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('database_templates')
      .delete()
      .eq('id', id);

    return { error: error?.message };
  },

  async createDatabaseFromTemplate(
    templateId: string,
    userId: string,
    workspaceId: string,
    customName?: string
  ) {
    try {
      // Fetch the template
      const { data: template, error: templateError } = await supabase
        .from('database_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) {
        return { data: null, error: templateError.message };
      }

      if (!template) {
        return { data: null, error: 'Template not found' };
      }

      // Type assertion for template_data
      const templateData = template.template_data as DatabaseTemplate['template_data'];
      const databaseName = customName || template.name;
      const tableName = `db_${databaseName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_${Date.now()}`;

      // Create the database record
      const { data: newDatabase, error: databaseError } = await supabase
        .from('databases')
        .insert({
          name: databaseName,
          description: template.description,
          table_name: tableName,
          workspace_id: workspaceId,
          created_by: userId,
        })
        .select()
        .single();

      if (databaseError) {
        return { data: null, error: databaseError.message };
      }

      // Create fields from template
      if (templateData.fields && Array.isArray(templateData.fields)) {
        const fieldsToCreate = templateData.fields.map((field: any, index: number) => ({
          database_id: newDatabase.id,
          name: field.name,
          type: field.type,
          settings: field.settings || {},
          pos: index,
          created_by: userId,
        }));

        const { error: fieldsError } = await supabase
          .from('database_properties')
          .insert(fieldsToCreate);

        if (fieldsError) {
          console.error('Failed to create fields from template:', fieldsError);
        }
      }

      return { data: newDatabase, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create database from template' 
      };
    }
  },

  async fetchViewTemplates() {
    const { data, error } = await supabase
      .from('view_templates')
      .select('*')
      .eq('is_system_template', true)
      .order('name');

    return { data: data as ViewTemplate[], error: error?.message };
  },
};
