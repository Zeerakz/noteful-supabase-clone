import { DatabaseField } from '@/types/database';
import { GroupingConfig, GroupedItem, GroupNode, FlattenedGroup } from '@/types/grouping';

export function createMultiLevelGroups(
  items: any[],
  fields: DatabaseField[],
  groupingConfig: GroupingConfig,
  collapsedGroups: string[] = []
): FlattenedGroup[] {
  if (groupingConfig.levels.length === 0) {
    return [];
  }

  // Convert items to grouped items format
  const groupedItems: GroupedItem[] = items.map(item => ({
    id: item.id,
    title: item.title,
    properties: item.properties || {},
    groupPath: []
  }));

  // Build the hierarchical group tree
  const rootNode = buildGroupTree(groupedItems, fields, groupingConfig, 0);
  
  // Flatten the tree into a list for rendering
  return flattenGroupTree(rootNode, [], collapsedGroups);
}

function buildGroupTree(
  items: GroupedItem[],
  fields: DatabaseField[],
  groupingConfig: GroupingConfig,
  currentLevel: number
): GroupNode {
  const root: GroupNode = {
    value: '',
    items: [],
    children: new Map(),
    level: -1,
    fieldId: '',
    isCollapsed: false
  };

  if (currentLevel >= groupingConfig.levels.length) {
    root.items = items;
    return root;
  }

  const currentGrouping = groupingConfig.levels[currentLevel];
  const field = fields.find(f => f.id === currentGrouping.fieldId);
  
  if (!field) {
    root.items = items;
    return root;
  }

  // Group items by the current field value
  const groups = new Map<string, GroupedItem[]>();
  
  items.forEach(item => {
    const fieldValue = item.properties[currentGrouping.fieldId] || 'Uncategorized';
    
    if (!groups.has(fieldValue)) {
      groups.set(fieldValue, []);
    }
    
    const updatedItem = {
      ...item,
      groupPath: [...item.groupPath, fieldValue]
    };
    
    groups.get(fieldValue)!.push(updatedItem);
  });

  // Create child nodes for each group
  groups.forEach((groupItems, groupValue) => {
    const childNode = buildGroupTree(groupItems, fields, groupingConfig, currentLevel + 1);
    childNode.value = groupValue;
    childNode.level = currentLevel;
    childNode.fieldId = currentGrouping.fieldId;
    
    root.children.set(groupValue, childNode);
  });

  return root;
}

function flattenGroupTree(
  node: GroupNode,
  currentPath: string[],
  collapsedGroups: string[]
): FlattenedGroup[] {
  const result: FlattenedGroup[] = [];
  
  // If this is not the root node, add it as a group header
  if (node.level >= 0) {
    const groupKey = [...currentPath, node.value].join('|');
    const isCollapsed = collapsedGroups.includes(groupKey);
    
    result.push({
      groupPath: [...currentPath, node.value],
      groupValue: node.value,
      level: node.level,
      fieldId: node.fieldId,
      items: node.items,
      isCollapsed
    });
    
    // If collapsed, don't render children
    if (isCollapsed) {
      return result;
    }
  }
  
  // Add child groups
  const newPath = node.level >= 0 ? [...currentPath, node.value] : currentPath;
  
  node.children.forEach(childNode => {
    result.push(...flattenGroupTree(childNode, newPath, collapsedGroups));
  });
  
  // If this is a leaf node with items, they're already included in the group
  
  return result;
}

export function getGroupKey(groupPath: string[]): string {
  return groupPath.join('|');
}

export function getSelectFieldOptions(field: DatabaseField): string[] {
  if (!field.settings) return [];

  switch (field.type) {
    case 'select':
    case 'multi_select': {
      const options = field.settings.options || [];
      return options
        .filter((option: any) => option.id && option.id.trim() !== '')
        .map((option: any) => option.name);
    }
    case 'status': {
      const groups = field.settings.groups || [];
      return groups.flatMap((group: any) =>
        (group.options || [])
          .filter((option: any) => option.id && option.id.trim() !== '')
          .map((option: any) => option.name)
      );
    }
    default:
      return [];
  }
}
