
import { propertyRegistry } from '@/types/propertyRegistry';
import { textPropertyType } from '@/components/property/types/TextPropertyType';
import { numberPropertyType } from '@/components/property/types/NumberPropertyType';
import { statusPropertyType } from '@/components/property/types/StatusPropertyType';
import { peoplePropertyType } from '@/components/property/types/PeoplePropertyType';
import { fileAttachmentPropertyType } from '@/components/property/types/FileAttachmentPropertyType';
import { checkboxPropertyType } from '@/components/property/types/CheckboxPropertyType';
import { buttonPropertyType } from '@/components/property/types/ButtonPropertyType';
import { datePropertyType } from '@/components/property/types/DatePropertyType';
import { selectPropertyType, multiSelectPropertyType } from '@/components/property/types/SelectPropertyType';

// Import other property types as they are created
// import { urlPropertyType } from '@/components/property/types/UrlPropertyType';
// import { emailPropertyType } from '@/components/property/types/EmailPropertyType';
// import { phonePropertyType } from '@/components/property/types/PhonePropertyType';
// import { relationPropertyType } from '@/components/property/types/RelationPropertyType';
// import { formulaPropertyType } from '@/components/property/types/FormulaPropertyType';
// import { rollupPropertyType } from '@/components/property/types/RollupPropertyType';
// import { richTextPropertyType } from '@/components/property/types/RichTextPropertyType';
// import { ratingPropertyType } from '@/components/property/types/RatingPropertyType';
// import { progressPropertyType } from '@/components/property/types/ProgressPropertyType';
// import { currencyPropertyType } from '@/components/property/types/CurrencyPropertyType';

export function initializePropertyRegistry() {
  // Register all built-in property types
  propertyRegistry.register(textPropertyType);
  propertyRegistry.register(numberPropertyType);
  propertyRegistry.register(statusPropertyType);
  propertyRegistry.register(peoplePropertyType);
  propertyRegistry.register(fileAttachmentPropertyType);
  propertyRegistry.register(checkboxPropertyType);
  propertyRegistry.register(buttonPropertyType);
  propertyRegistry.register(datePropertyType);
  propertyRegistry.register(selectPropertyType);
  propertyRegistry.register(multiSelectPropertyType);
  
  // TODO: Register other property types
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
