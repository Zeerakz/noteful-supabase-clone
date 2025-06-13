
import { propertyRegistry } from '@/types/propertyRegistry';
import { errorHandler } from '@/utils/errorHandler';

// Import property types with error handling
const importPropertyType = async (importFn: () => any, typeName: string) => {
  try {
    console.log(`📦 Importing ${typeName} property type...`);
    return await importFn();
  } catch (error) {
    console.error(`❌ Failed to import ${typeName} property type:`, error);
    errorHandler.logError(error as Error, { 
      context: 'property_type_import', 
      propertyType: typeName 
    });
    return null;
  }
};

export async function initializePropertyRegistry() {
  console.log('🔧 Starting property registry initialization...');
  
  try {
    // Import basic property types
    const { textPropertyType } = await importPropertyType(
      () => import('@/components/property/types/TextPropertyType'),
      'text'
    ) || {};
    
    const { numberPropertyType } = await importPropertyType(
      () => import('@/components/property/types/NumberPropertyType'),
      'number'
    ) || {};
    
    const { statusPropertyType } = await importPropertyType(
      () => import('@/components/property/types/StatusPropertyType'),
      'status'
    ) || {};
    
    const { peoplePropertyType } = await importPropertyType(
      () => import('@/components/property/types/PeoplePropertyType'),
      'people'
    ) || {};
    
    const { fileAttachmentPropertyType } = await importPropertyType(
      () => import('@/components/property/types/FileAttachmentPropertyType'),
      'file_attachment'
    ) || {};
    
    const { checkboxPropertyType } = await importPropertyType(
      () => import('@/components/property/types/CheckboxPropertyType'),
      'checkbox'
    ) || {};
    
    const { buttonPropertyType } = await importPropertyType(
      () => import('@/components/property/types/ButtonPropertyType'),
      'button'
    ) || {};
    
    const { datePropertyType } = await importPropertyType(
      () => import('@/components/property/types/DatePropertyType'),
      'date'
    ) || {};
    
    const { selectPropertyType, multiSelectPropertyType } = await importPropertyType(
      () => import('@/components/property/types/SelectPropertyType'),
      'select'
    ) || {};

    // Register all successfully imported property types
    const propertyTypes = [
      { type: textPropertyType, name: 'text' },
      { type: numberPropertyType, name: 'number' },
      { type: statusPropertyType, name: 'status' },
      { type: peoplePropertyType, name: 'people' },
      { type: fileAttachmentPropertyType, name: 'file_attachment' },
      { type: checkboxPropertyType, name: 'checkbox' },
      { type: buttonPropertyType, name: 'button' },
      { type: datePropertyType, name: 'date' },
      { type: selectPropertyType, name: 'select' },
      { type: multiSelectPropertyType, name: 'multi_select' },
    ];

    let successCount = 0;
    let failureCount = 0;

    for (const { type, name } of propertyTypes) {
      try {
        if (type) {
          propertyRegistry.register(type);
          console.log(`✅ Registered ${name} property type`);
          successCount++;
        } else {
          console.warn(`⚠️ Skipping ${name} property type (failed to import)`);
          failureCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to register ${name} property type:`, error);
        errorHandler.logError(error as Error, { 
          context: 'property_type_registration', 
          propertyType: name 
        });
        failureCount++;
      }
    }
    
    console.log(`🎉 Property registry initialization complete: ${successCount} successful, ${failureCount} failed`);
    console.log(`📊 Total registered types: ${propertyRegistry.getTypes().length}`);
    
    if (failureCount > 0) {
      console.warn(`⚠️ Some property types failed to initialize. App functionality may be limited.`);
    }
    
  } catch (error) {
    console.error('💥 Critical error during property registry initialization:', error);
    errorHandler.logError(error as Error, { context: 'property_registry_init_critical' });
    throw error; // Re-throw to prevent app from starting with broken registry
  }
}

// Utility function to register a custom property type at runtime
export function registerCustomPropertyType(definition: any) {
  try {
    propertyRegistry.register(definition);
    console.log(`✅ Custom property type registered: ${definition.type}`);
  } catch (error) {
    console.error(`❌ Failed to register custom property type:`, error);
    errorHandler.logError(error as Error, { 
      context: 'custom_property_registration',
      propertyType: definition?.type 
    });
    throw error;
  }
}

// Only initialize on client side with error handling
if (typeof window !== 'undefined') {
  console.log('🌐 Client-side detected, initializing property registry...');
  initializePropertyRegistry().catch((error) => {
    console.error('💥 Failed to initialize property registry on client:', error);
    // Don't prevent app from loading, but log the error
    errorHandler.logError(error, { context: 'client_side_init' });
  });
}
