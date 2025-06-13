
import { DatabaseField, RelationFieldSettings } from '@/types/database';
import { DatabaseFieldService } from '@/services/database/databaseFieldService';

export class RelationValidationService {
  /**
   * Validates that a bidirectional relation won't create conflicts
   */
  static async validateBidirectionalRelation(
    sourceDatabaseId: string,
    targetDatabaseId: string,
    relatedPropertyName: string,
    excludeFieldId?: string
  ): Promise<{ valid: boolean; error?: string; conflictingField?: DatabaseField }> {
    try {
      // Get all fields in the target database
      const { data: targetFields, error } = await DatabaseFieldService.fetchDatabaseFields(targetDatabaseId);
      
      if (error) {
        return { valid: false, error: `Failed to validate relation: ${error}` };
      }

      if (!targetFields) {
        return { valid: true };
      }

      // Check for existing fields with the same name
      const nameConflict = targetFields.find(field => 
        field.name === relatedPropertyName && 
        field.id !== excludeFieldId
      );

      if (nameConflict) {
        return {
          valid: false,
          error: `A field named "${relatedPropertyName}" already exists in the target database`,
          conflictingField: nameConflict
        };
      }

      // For self-referencing relations, check for circular backlinks
      if (sourceDatabaseId === targetDatabaseId) {
        const existingRelationFields = targetFields.filter(field => {
          if (field.type !== 'relation' || field.id === excludeFieldId) {
            return false;
          }
          
          const settings = field.settings as RelationFieldSettings | null;
          return settings?.bidirectional && settings?.target_database_id === sourceDatabaseId;
        });

        // Check if any existing relation field has the same backlink name
        const backlinkConflict = existingRelationFields.find(field => {
          const settings = field.settings as RelationFieldSettings | null;
          return settings?.related_property_name === relatedPropertyName;
        });

        if (backlinkConflict) {
          return {
            valid: false,
            error: `A backlink property named "${relatedPropertyName}" already exists`,
            conflictingField: backlinkConflict
          };
        }

        // Check for potential circular references
        const potentialCircular = existingRelationFields.find(field => {
          const settings = field.settings as RelationFieldSettings | null;
          const fieldBacklinkName = settings?.related_property_name;
          return fieldBacklinkName && 
                 targetFields.some(f => f.name === fieldBacklinkName && f.type === 'relation');
        });

        if (potentialCircular) {
          console.warn('Potential circular reference detected, but allowing creation with warning');
        }
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Suggests a unique backlink property name
   */
  static async suggestUniqueBacklinkName(
    targetDatabaseId: string,
    baseNamePrefix: string = 'Related'
  ): Promise<string> {
    try {
      const { data: fields } = await DatabaseFieldService.fetchDatabaseFields(targetDatabaseId);
      
      if (!fields) {
        return `${baseNamePrefix} items`;
      }

      const existingNames = new Set(fields.map(field => field.name.toLowerCase()));
      const existingBacklinkNames = new Set(
        fields
          .filter(field => field.type === 'relation')
          .map(field => {
            const settings = field.settings as RelationFieldSettings | null;
            return settings?.related_property_name?.toLowerCase();
          })
          .filter(Boolean) as string[]
      );

      // Try common variations
      const candidates = [
        `${baseNamePrefix} items`,
        `${baseNamePrefix} records`,
        `${baseNamePrefix} entries`,
        `Linked ${baseNamePrefix.toLowerCase()}`,
        `Related ${baseNamePrefix.toLowerCase()}`,
      ];

      for (const candidate of candidates) {
        const lowerCandidate = candidate.toLowerCase();
        if (!existingNames.has(lowerCandidate) && !existingBacklinkNames.has(lowerCandidate)) {
          return candidate;
        }
      }

      // Fallback with numbers
      let counter = 1;
      while (true) {
        const candidate = `${baseNamePrefix} items ${counter}`;
        const lowerCandidate = candidate.toLowerCase();
        if (!existingNames.has(lowerCandidate) && !existingBacklinkNames.has(lowerCandidate)) {
          return candidate;
        }
        counter++;
      }

    } catch (error) {
      console.error('Failed to suggest unique backlink name:', error);
      return `${baseNamePrefix} items`;
    }
  }

  /**
   * Checks if a relation field would create an infinite loop
   */
  static detectInfiniteLoop(
    sourceDatabaseId: string,
    targetDatabaseId: string,
    existingRelations: DatabaseField[]
  ): boolean {
    // For now, just check direct circular reference
    // In a more sophisticated implementation, you'd do a graph traversal
    
    if (sourceDatabaseId !== targetDatabaseId) {
      return false; // Different databases, no immediate loop
    }

    // Self-referencing is allowed, but warn about potential complexity
    const bidirectionalCount = existingRelations.filter(field => {
      if (field.type !== 'relation') return false;
      
      const settings = field.settings as RelationFieldSettings | null;
      return settings?.bidirectional && settings?.target_database_id === sourceDatabaseId;
    }).length;

    // Allow up to 3 self-referencing bidirectional relations before warning
    return bidirectionalCount >= 3;
  }
}
