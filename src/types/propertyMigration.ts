
export interface PropertyMigrationResult {
  fieldId: string;
  fromType: string;
  toType: string;
  totalValues: number;
  successfulConversions: number;
  failedConversions: number;
  lostValues: number;
  previewSamples: {
    successful: Array<{ original: string; converted: string }>;
    failed: Array<{ original: string; reason: string }>;
  };
}

export interface PropertyMigrationPreview {
  canMigrate: boolean;
  warnings: string[];
  result: PropertyMigrationResult;
}

export interface MigrationRule {
  fromType: string;
  toType: string;
  converter: (value: string) => { success: boolean; value: string; error?: string };
  isLossy: boolean;
  warnings: string[];
}
