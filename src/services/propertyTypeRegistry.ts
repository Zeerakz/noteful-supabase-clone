
import { propertyRegistry, PropertyTypeDefinition } from '@/types/propertyRegistry';
import { errorHandler } from '@/utils/errorHandler';

// Import all property type definitions
import { textPropertyType } from '@/components/property/types/TextPropertyType';
import { numberPropertyType } from '@/components/property/types/NumberPropertyType';
import { statusPropertyType } from '@/components/property/types/StatusPropertyType';
import { peoplePropertyType } from '@/components/property/types/PeoplePropertyType';
import { fileAttachmentPropertyType } from '@/components/property/types/FileAttachmentPropertyType';
import { checkboxPropertyType } from '@/components/property/types/CheckboxPropertyType';
import { buttonPropertyType } from '@/components/property/types/ButtonPropertyType';
import { datePropertyType } from '@/components/property/types/DatePropertyType';
import { selectPropertyType, multiSelectPropertyType } from '@/components/property/types/SelectPropertyType';
import { relationPropertyType } from '@/components/property/types/RelationPropertyType';
import { unsupportedPropertyType } from '@/components/property/types/UnsupportedPropertyType';

const allPropertyTypes: { definition: PropertyTypeDefinition<any>; name: string }[] = [
  { definition: textPropertyType, name: 'text' },
  { definition: numberPropertyType, name: 'number' },
  { definition: statusPropertyType, name: 'status' },
  { definition: peoplePropertyType, name: 'people' },
  { definition: fileAttachmentPropertyType, name: 'file_attachment' },
  { definition: checkboxPropertyType, name: 'checkbox' },
  { definition: buttonPropertyType, name: 'button' },
  { definition: datePropertyType, name: 'date' },
  { definition: selectPropertyType, name: 'select' },
  { definition: multiSelectPropertyType, name: 'multi_select' },
  { definition: relationPropertyType, name: 'relation' },
  { definition: unsupportedPropertyType, name: 'unsupported' },
];

let isInitialized = false;

export function initializePropertyRegistry() {
  if (isInitialized) {
    console.log('📖 Property registry already initialized.');
    return;
  }
  
  console.log('🔧 Starting property registry initialization...');
  let successCount = 0;
  let failureCount = 0;

  for (const { definition, name } of allPropertyTypes) {
    try {
      if (definition && !propertyRegistry.has(definition.type)) {
        propertyRegistry.register(definition);
        successCount++;
      }
    } catch (error) {
      errorHandler.logError(error as Error, {
        context: 'property_type_registration',
        propertyType: name,
      });
      failureCount++;
    }
  }

  console.log(`🎉 Property registry initialization complete: ${successCount} successful, ${failureCount} failed.`);
  console.log(`📊 Total registered types: ${propertyRegistry.getTypes().length}`);

  if (failureCount > 0) {
    console.warn(`⚠️ ${failureCount} property type(s) failed to initialize. App functionality may be limited.`);
  }

  isInitialized = true;
}

// Only initialize on client side
if (typeof window !== 'undefined') {
  initializePropertyRegistry();
}
