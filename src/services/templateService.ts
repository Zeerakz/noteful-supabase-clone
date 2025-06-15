
import { supabase } from '@/integrations/supabase/client';
import { Template, TemplateCreateRequest } from '@/types/template';

export const TemplateService = {
  async fetchTemplates(workspaceId: string) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    return { data, error: error?.message };
  },

  async createTemplate(userId: string, request: TemplateCreateRequest) {
    const { data, error } = await supabase
      .from('templates')
      .insert({
        ...request,
        created_by: userId,
      })
      .select()
      .single();

    return { data, error: error?.message };
  },

  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    return { error: error?.message };
  },

  async createPageFromTemplate(
    templateId: string, 
    userId: string, 
    workspaceId: string, 
    pageName?: string
  ) {
    try {
      // Fetch the template
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) {
        return { data: null, error: templateError.message };
      }

      if (!template) {
        return { data: null, error: 'Template not found' };
      }

      // Create a new page (which is a block of type 'page')
      const pageTitle = pageName || `${template.name} (Copy)`;
      const { data: newPage, error: pageError } = await supabase
        .from('blocks')
        .insert({
          properties: { title: pageTitle },
          workspace_id: workspaceId,
          created_by: userId,
          last_edited_by: userId,
          type: 'page',
        })
        .select()
        .single();

      if (pageError) {
        return { data: null, error: pageError.message };
      }

      // Type-safe content parsing
      const templateContent = template.content;
      if (templateContent && typeof templateContent === 'object' && !Array.isArray(templateContent)) {
        const contentObj = templateContent as { [key: string]: any };
        
        if (contentObj.blocks && Array.isArray(contentObj.blocks)) {
          // Create blocks from template
          const blocksToCreate = contentObj.blocks.map((block: any, index: number) => ({
            parent_id: newPage.id,
            workspace_id: workspaceId,
            type: block.type || 'text',
            content: block.content || {},
            properties: block.properties || {},
            pos: block.pos !== undefined ? block.pos : index,
            created_by: userId,
            last_edited_by: userId,
          }));

          if (blocksToCreate.length > 0) {
            const { error: blocksError } = await supabase
              .from('blocks')
              .insert(blocksToCreate);

            if (blocksError) {
              // If blocks creation fails, we should still return the page
              console.error('Failed to create blocks from template:', blocksError);
            }
          }
        }
      }

      return { data: newPage, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to create page from template' 
      };
    }
  },
};
