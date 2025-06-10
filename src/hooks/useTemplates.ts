
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Template, TemplateCreateRequest } from '@/types/template';
import { TemplateService } from '@/services/templateService';

export function useTemplates(workspaceId?: string) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTemplates = async () => {
    if (!user || !workspaceId) return;

    try {
      setLoading(true);
      const { data, error } = await TemplateService.fetchTemplates(workspaceId);

      if (error) throw new Error(error);
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (request: TemplateCreateRequest) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await TemplateService.createTemplate(user.id, request);
    
    if (!error) {
      // Refresh templates list
      await fetchTemplates();
    }
    
    return { data, error };
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await TemplateService.deleteTemplate(id);
    
    if (!error) {
      // Refresh templates list
      await fetchTemplates();
    }
    
    return { error };
  };

  const createPageFromTemplate = async (templateId: string, pageName?: string) => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected' };

    const { data, error } = await TemplateService.createPageFromTemplate(
      templateId, 
      user.id, 
      workspaceId, 
      pageName
    );
    
    return { data, error };
  };

  useEffect(() => {
    fetchTemplates();
  }, [user, workspaceId]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    createPageFromTemplate,
  };
}
