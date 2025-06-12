
import { Property } from './propertyTypes';
import type { TextProperty, NumberProperty, SelectProperty, MultiSelectProperty, DateProperty, DateTimeProperty, CheckboxProperty, RelationProperty, FormulaProperty, RollupProperty } from './propertyTypes';

// Type guard functions
export function isTextProperty(property: Property): property is TextProperty {
  return property.type === 'text';
}

export function isNumberProperty(property: Property): property is NumberProperty {
  return property.type === 'number';
}

export function isSelectProperty(property: Property): property is SelectProperty {
  return property.type === 'select';
}

export function isMultiSelectProperty(property: Property): property is MultiSelectProperty {
  return property.type === 'multi_select';
}

export function isDateProperty(property: Property): property is DateProperty {
  return property.type === 'date';
}

export function isDateTimeProperty(property: Property): property is DateTimeProperty {
  return property.type === 'datetime';
}

export function isCheckboxProperty(property: Property): property is CheckboxProperty {
  return property.type === 'checkbox';
}

export function isRelationProperty(property: Property): property is RelationProperty {
  return property.type === 'relation';
}

export function isFormulaProperty(property: Property): property is FormulaProperty {
  return property.type === 'formula';
}

export function isRollupProperty(property: Property): property is RollupProperty {
  return property.type === 'rollup';
}
