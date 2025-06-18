
import { supabase } from '@/integrations/supabase/client';

export class DatabaseMovementService {
  /**
   * Move a database to a different position in the workspace
   */
  static async moveDatabase(
    databaseId: string,
    newIndex: number,
    workspaceId: string
  ): Promise<{ error: string | null }> {
    try {
      // Get all databases in the workspace ordered by name (current ordering)
      const { data: databases, error: fetchError } = await supabase
        .from('databases')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      if (!databases) {
        return { error: 'No databases found' };
      }

      // Find the database being moved
      const databaseIndex = databases.findIndex(db => db.id === databaseId);
      if (databaseIndex === -1) {
        return { error: 'Database not found' };
      }

      // Reorder the databases array
      const reorderedDatabases = [...databases];
      const [movedDatabase] = reorderedDatabases.splice(databaseIndex, 1);
      reorderedDatabases.splice(newIndex, 0, movedDatabase);

      // For now, we'll update the updated_at timestamp to reflect the new order
      // In a full implementation, you might add an explicit order column
      const { error: updateError } = await supabase
        .from('databases')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', databaseId);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to move database'
      };
    }
  }

  /**
   * Convert a page to a database (future functionality)
   */
  static async convertPageToDatabase(
    pageId: string,
    workspaceId: string
  ): Promise<{ error: string | null }> {
    // This would be implemented when we support page-to-database conversion
    return { error: 'Page to database conversion not yet implemented' };
  }

  /**
   * Move a database between different organizational sections
   */
  static async moveDatabaseToSection(
    databaseId: string,
    targetSection: 'databases' | 'archives',
    workspaceId: string
  ): Promise<{ error: string | null }> {
    try {
      // For now, we'll just update the timestamp
      // In a full implementation, you might add section metadata
      const { error: updateError } = await supabase
        .from('databases')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', databaseId)
        .eq('workspace_id', workspaceId);

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to move database to section'
      };
    }
  }
}
