
export interface SystemPropertyType {
  id: 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by' | 'id';
  name: string;
  description: string;
  readonly: true;
  system: true;
}

export const SYSTEM_PROPERTIES: Record<string, SystemPropertyType> = {
  created_time: {
    id: 'created_time',
    name: 'Created Time',
    description: 'Date and time when the page was created',
    readonly: true,
    system: true,
  },
  created_by: {
    id: 'created_by',
    name: 'Created By',
    description: 'User who created the page',
    readonly: true,
    system: true,
  },
  last_edited_time: {
    id: 'last_edited_time',
    name: 'Last Edited Time',
    description: 'Date and time when the page was last modified',
    readonly: true,
    system: true,
  },
  last_edited_by: {
    id: 'last_edited_by',
    name: 'Last Edited By',
    description: 'User who last modified the page',
    readonly: true,
    system: true,
  },
  id: {
    id: 'id',
    name: 'ID',
    description: 'Unique identifier of the page',
    readonly: true,
    system: true,
  },
};

export function isSystemProperty(fieldType: string): boolean {
  return Object.keys(SYSTEM_PROPERTIES).includes(fieldType);
}

export function getSystemPropertyValue(propertyId: string, page: any, userProfiles?: any[]): string {
  switch (propertyId) {
    case 'created_time':
      return page.created_at ? new Date(page.created_at).toLocaleString() : '';
    case 'created_by':
      if (page.created_by && userProfiles) {
        const user = userProfiles.find(u => u.id === page.created_by);
        return user?.full_name || user?.email || 'Unknown User';
      }
      return 'Unknown User';
    case 'last_edited_time':
      return page.updated_at ? new Date(page.updated_at).toLocaleString() : '';
    case 'last_edited_by':
      if (page.updated_by && userProfiles) {
        const user = userProfiles.find(u => u.id === page.updated_by);
        return user?.full_name || user?.email || 'Unknown User';
      } else if (page.created_by && userProfiles) {
        const user = userProfiles.find(u => u.id === page.created_by);
        return user?.full_name || user?.email || 'Unknown User';
      }
      return 'Unknown User';
    case 'id':
      return page.id || '';
    default:
      return '';
  }
}
