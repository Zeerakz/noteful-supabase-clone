
import { propertyRegistry } from '@/types/propertyRegistry';
import { textPropertyType } from '@/components/property/types/TextPropertyType';
import { numberPropertyType } from '@/components/property/types/NumberPropertyType';
import { statusPropertyType } from '@/components/property/types/StatusPropertyType';
import { peoplePropertyType } from '@/components/property/types/PeoplePropertyType';
import { fileAttachmentPropertyType } from '@/components/property/types/FileAttachmentPropertyType';

// Import other property types as they are created
// import { selectPropertyType } from '@/components/property/types/SelectPropertyType';
// ... etc

export function initializePropertyRegistry() {
  // Register all built-in property types
  propertyRegistry.register(textPropertyType);
  propertyRegistry.register(numberPropertyType);
  propertyRegistry.register(statusPropertyType);
  propertyRegistry.register(peoplePropertyType);
  propertyRegistry.register(fileAttachmentPropertyType);
  
  // TODO: Register other property types
  // propertyRegistry.register(selectPropertyType);
  // propertyRegistry.register(datePropertyType);
  // propertyRegistry.register(checkboxPropertyType);
  // propertyRegistry.register(urlPropertyType);
  // propertyRegistry.register(emailPropertyType);
  // propertyRegistry.register(phonePropertyType);
  // propertyRegistry.register(relationPropertyType);
  // propertyRegistry.register(formulaPropertyType);
  // propertyRegistry.register(rollupPropertyType);
  // propertyRegistry.register(richTextPropertyType);
  // propertyRegistry.register(ratingPropertyType);
  // propertyRegistry.register(progressPropertyType);
  // propertyRegistry.register(currencyPropertyType);
  
  console.log('Property registry initialized with', propertyRegistry.getTypes().length, 'types');
}

// Utility function to register a custom property type at runtime
export function registerCustomPropertyType(definition: any) {
  propertyRegistry.register(definition);
}

// Ensure the registry is initialized when this module is imported
// This guarantees property types are available during inheritance operations
if (typeof window !== 'undefined') {
  // Only initialize on client side
  initializePropertyRegistry();
}
