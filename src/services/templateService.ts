
import { supabase } from '@/integrations/supabase/client';
import { Template, TemplateCreateRequest } from '@/types/template';

export class TemplateService {
  static async fetchTemplates(workspaceId: string): Promise<{ data: Template[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch templates' 
      };
    }
  }

  static async createTemplate(
    userId: string,
    request: TemplateCreateRequest
  ): Promise<{ data: Template | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert([
          {
            name: request.name,
            content: request.content,
            workspace_id: request.workspace_id,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create template' 
      };
    }
  }

  static async deleteTemplate(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Failed to delete template' 
      };
    }
  }

  static async createPageFromTemplate(
    templateId: string,
    userId: string,
    workspaceId: string,
    pageName?: string
  ): Promise<{ data: any | null; error: string | null }> {
    try {
      // First fetch the template
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Create new page
      const { data: newPage, error: pageError } = await supabase
        .from('pages')
        .insert([
          {
            workspace_id: workspaceId,
            title: pageName || `${template.name} Page`,
            created_by: userId,
            order_index: 0,
          },
        ])
        .select()
        .single();

      if (pageError) throw pageError;

      // Create blocks from template content
      if (template.content && template.content.blocks) {
        const blocksToInsert = template.content.blocks.map((block: any, index: number) => ({
          page_id: newPage.id,
          type: block.type,
          content: block.content,
          pos: index,
          created_by: userId,
        }));

        const { error: blocksError } = await supabase
          .from('blocks')
          .insert(blocksToInsert);

        if (blocksError) throw blocksError;
      }

      return { data: newPage, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create page from template' 
      };
    }
  }
}
