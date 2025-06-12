
import { useEffect, useMemo } from 'react';
import { propertyRegistry, PropertyTypeDefinition } from '@/types/propertyRegistry';
import { PropertyType } from '@/types/property';

export function usePropertyRegistry() {
  const registeredTypes = useMemo(() => propertyRegistry.getTypes(), []);
  
  const getDefinition = (type: PropertyType): PropertyTypeDefinition | undefined => {
    return propertyRegistry.get(type);
  };
  
  const getAllDefinitions = (): PropertyTypeDefinition[] => {
    return propertyRegistry.getAll();
  };
  
  const getDefinitionsByCategory = (category: PropertyTypeDefinition['category']): PropertyTypeDefinition[] => {
    return propertyRegistry.getAllByCategory(category);
  };
  
  const isRegistered = (type: PropertyType): boolean => {
    return propertyRegistry.has(type);
  };
  
  return {
    registeredTypes,
    getDefinition,
    getAllDefinitions,
    getDefinitionsByCategory,
    isRegistered,
    validateConfig: propertyRegistry.validateConfig.bind(propertyRegistry),
    validateValue: propertyRegistry.validateValue.bind(propertyRegistry),
    getDefaultConfig: propertyRegistry.getDefaultConfig.bind(propertyRegistry),
    getDefaultValue: propertyRegistry.getDefaultValue.bind(propertyRegistry),
    formatValue: propertyRegistry.formatValue.bind(propertyRegistry),
  };
}
