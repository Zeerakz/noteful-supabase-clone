import { Property, PropertyType, PropertyConfig } from './property';
import { ReactNode } from 'react';

// Interface that every property type must implement
export interface PropertyTypeDefinition<T extends PropertyConfig = PropertyConfig> {
  // Basic metadata
  type: PropertyType;
  label: string;
  description: string;
  icon: ReactNode;
  category: 'basic' | 'advanced' | 'computed' | 'media' | 'relationship';
  
  // Configuration
  getDefaultConfig: () => T;
  validateConfig: (config: T) => { isValid: boolean; errors: string[] };
  
  // Value handling
  getDefaultValue: (config: T) => any;
  validateValue: (value: any, config: T) => { isValid: boolean; errors: string[] };
  formatValue: (value: any, config: T) => string;
  parseValue: (input: string, config: T) => any;
  
  // UI Components
  ConfigEditor: React.ComponentType<{
    config: T;
    onConfigChange: (config: T) => void;
    workspaceId?: string;
    availableProperties?: Property[];
  }>;
  
  FieldDisplay: React.ComponentType<{
    value: any;
    config: T;
    field?: any;
    pageId?: string;
    onValueChange?: (value: any) => void;
    inTable?: boolean;
  }>;
  
  FieldEditor: React.ComponentType<{
    value: any;
    config: T;
    onChange: (value: any) => void;
    field?: any;
    workspaceId?: string;
    pageId?: string;
  }>;
  
  // Optional features
  rendersEmpty?: boolean;
  isComputed?: boolean;
  dependencies?: string[]; // Field IDs this type depends on
  supportsFiltering?: boolean;
  supportsSorting?: boolean;
  supportsGrouping?: boolean;
  
  // Computed field specific (if isComputed is true)
  computeValue?: (dependencies: Record<string, any>, config: T) => any;
  
  // Advanced features
  exportValue?: (value: any, config: T) => string;
  importValue?: (input: string, config: T) => any;
  searchableText?: (value: any, config: T) => string;
}

// Registry class to manage property types
export class PropertyTypeRegistry {
  private static instance: PropertyTypeRegistry;
  private definitions = new Map<PropertyType, PropertyTypeDefinition>();
  
  static getInstance(): PropertyTypeRegistry {
    if (!this.instance) {
      this.instance = new PropertyTypeRegistry();
    }
    return this.instance;
  }
  
  register<T extends PropertyConfig>(definition: PropertyTypeDefinition<T>): void {
    this.definitions.set(definition.type, definition as PropertyTypeDefinition);
    console.log(`Registered property type: ${definition.type}`);
  }
  
  unregister(type: PropertyType): boolean {
    return this.definitions.delete(type);
  }
  
  get(type: PropertyType): PropertyTypeDefinition | undefined {
    return this.definitions.get(type);
  }
  
  getAll(): PropertyTypeDefinition[] {
    return Array.from(this.definitions.values());
  }
  
  getAllByCategory(category: PropertyTypeDefinition['category']): PropertyTypeDefinition[] {
    return this.getAll().filter(def => def.category === category);
  }
  
  has(type: PropertyType): boolean {
    return this.definitions.has(type);
  }
  
  getTypes(): PropertyType[] {
    return Array.from(this.definitions.keys());
  }
  
  // Utility methods
  validateConfig(type: PropertyType, config: PropertyConfig): { isValid: boolean; errors: string[] } {
    const definition = this.get(type);
    if (!definition) {
      return { isValid: false, errors: [`Unknown property type: ${type}`] };
    }
    return definition.validateConfig(config);
  }
  
  validateValue(type: PropertyType, value: any, config: PropertyConfig): { isValid: boolean; errors: string[] } {
    const definition = this.get(type);
    if (!definition) {
      return { isValid: false, errors: [`Unknown property type: ${type}`] };
    }
    return definition.validateValue(value, config);
  }
  
  getDefaultConfig(type: PropertyType): PropertyConfig | null {
    const definition = this.get(type);
    return definition ? definition.getDefaultConfig() : null;
  }
  
  getDefaultValue(type: PropertyType, config: PropertyConfig): any {
    const definition = this.get(type);
    return definition ? definition.getDefaultValue(config) : null;
  }
  
  formatValue(type: PropertyType, value: any, config: PropertyConfig): string {
    const definition = this.get(type);
    return definition ? definition.formatValue(value, config) : String(value || '');
  }
}

// Singleton instance
export const propertyRegistry = PropertyTypeRegistry.getInstance();
