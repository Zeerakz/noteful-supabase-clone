
import { useMemo } from 'react';
import { createMultiLevelGroups } from '@/utils/multiLevelGrouping';
import { PageWithProperties } from './types';
import { DatabaseField } from '@/types/database';
import { Block } from '@/types/block';

interface UseDatabaseDataTransformationProps {
  pages: Block[];
  fieldsToUse: DatabaseField[];
  groupingConfig?: any;
  collapsedGroups?: string[];
}

export function useDatabaseDataTransformation({
  pages,
  fieldsToUse,
  groupingConfig,
  collapsedGroups = [],
}: UseDatabaseDataTransformationProps) {
  const pagesWithProperties: PageWithProperties[] = useMemo(() => {
    return pages.map(page => {
      const pageProperties: Record<string, any> = {};
      if (page.properties && typeof page.properties === 'object') {
        Object.entries(page.properties).forEach(([key, value]) => {
          pageProperties[key] = value;
        });
      }
      return {
        id: page.id,
        title: (page.properties as any)?.title || '',
        workspace_id: page.workspace_id,
        database_id: (page.properties as any)?.database_id || null,
        created_by: page.created_by || '',
        created_at: page.created_time,
        updated_at: page.last_edited_time,
        parent_id: page.parent_id,
        pos: page.pos,
        properties: pageProperties,
        rawPage: page,
      };
    });
  }, [pages]);

  const groupedData = useMemo(() => {
    return groupingConfig && groupingConfig.levels.length > 0
      ? createMultiLevelGroups(
          pagesWithProperties,
          fieldsToUse,
          groupingConfig,
          collapsedGroups
        )
      : [];
  }, [pagesWithProperties, fieldsToUse, groupingConfig, collapsedGroups]);
  
  const hasGrouping = groupingConfig && groupingConfig.levels.length > 0;

  return {
    pagesWithProperties,
    groupedData,
    hasGrouping,
  };
}
