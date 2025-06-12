
import { propertyRegistry } from '@/types/propertyRegistry';
import { textPropertyType } from '@/components/property/types/TextPropertyType';

// Import other property types as they are created
// import { numberPropertyType } from '@/components/property/types/NumberPropertyType';
// import { selectPropertyType } from '@/components/property/types/SelectPropertyType';
// ... etc

export function initializePropertyRegistry() {
  // Register all built-in property types
  propertyRegistry.register(textPropertyType);
  
  // TODO: Register other property types
  // propertyRegistry.register(numberPropertyType);
  // propertyRegistry.register(selectPropertyType);
  // propertyRegistry.register(datePropertyType);
  // propertyRegistry.register(checkboxPropertyType);
  // propertyRegistry.register(urlPropertyType);
  // propertyRegistry.register(emailPropertyType);
  // propertyRegistry.register(phonePropertyType);
  // propertyRegistry.register(relationPropertyType);
  // propertyRegistry.register(formulaPropertyType);
  // propertyRegistry.register(rollupPropertyType);
  // propertyRegistry.register(fileAttachmentPropertyType);
  // propertyRegistry.register(richTextPropertyType);
  // propertyRegistry.register(statusPropertyType);
  // propertyRegistry.register(peoplePropertyType);
  // propertyRegistry.register(ratingPropertyType);
  // propertyRegistry.register(progressPropertyType);
  // propertyRegistry.register(currencyPropertyType);
  
  console.log('Property registry initialized with', propertyRegistry.getTypes().length, 'types');
}

// Utility function to register a custom property type at runtime
export function registerCustomPropertyType(definition: any) {
  propertyRegistry.register(definition);
}
