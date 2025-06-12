
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseTemplate, DatabaseTemplateCreateRequest } from '@/types/databaseTemplate';
import { DatabaseTemplateService } from '@/services/databaseTemplateService';

export function useDatabaseTemplates(workspaceId?: string) {
  const [templates, setTemplates] = useState<DatabaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await DatabaseTemplateService.fetchTemplates(workspaceId);

      if (error) throw new Error(error);
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (request: DatabaseTemplateCreateRequest) => {
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await DatabaseTemplateService.createTemplate(user.id, request);
    
    if (!error) {
      await fetchTemplates();
    }
    
    return { data, error };
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await DatabaseTemplateService.deleteTemplate(id);
    
    if (!error) {
      await fetchTemplates();
    }
    
    return { error };
  };

  const createDatabaseFromTemplate = async (templateId: string, customName?: string) => {
    if (!user || !workspaceId) return { error: 'User not authenticated or workspace not selected' };

    const { data, error } = await DatabaseTemplateService.createDatabaseFromTemplate(
      templateId, 
      user.id, 
      workspaceId, 
      customName
    );
    
    return { data, error };
  };

  useEffect(() => {
    fetchTemplates();
  }, [workspaceId]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    createDatabaseFromTemplate,
  };
}
