
// Import all the service classes
import { DatabaseCoreService } from './database/databaseCoreService';
import { DatabaseFieldService } from './database/databaseFieldService';
import { DatabasePageService } from './database/databasePageService';
import { DatabasePropertyService } from './database/databasePropertyService';
import { DatabaseQueryService } from './database/databaseQueryService';

// Re-export all services for backward compatibility
export { DatabaseCoreService } from './database/databaseCoreService';
export { DatabaseFieldService } from './database/databaseFieldService';
export { DatabasePageService } from './database/databasePageService';
export { DatabasePropertyService } from './database/databasePropertyService';
export { DatabaseQueryService } from './database/databaseQueryService';

// Main DatabaseService class that aggregates all functionality
export class DatabaseService {
  // Database CRUD operations
  static createDatabase = DatabaseCoreService.createDatabase;
  static fetchDatabases = DatabaseCoreService.fetchDatabases;
  static deleteDatabase = DatabaseCoreService.deleteDatabase;

  // Field operations
  static fetchDatabaseFields = DatabaseFieldService.fetchDatabaseFields;

  // Page operations
  static createDatabasePage = DatabasePageService.createDatabasePage;

  // Property operations
  static createPageProperty = DatabasePropertyService.createPageProperty;

  // Query operations
  static fetchDatabasePages = DatabaseQueryService.fetchDatabasePages;
}
