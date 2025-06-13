
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { DatabaseField } from '@/types/database';
import { PropertyType } from '@/types/property';
import { PropertyMigrationPreview } from '@/types/propertyMigration';
import { PropertyMigrationService } from '@/services/propertyMigrationService';
import { isMigrationSupported } from '@/utils/propertyMigrationRules';
import { useToast } from '@/hooks/use-toast';

interface PropertyMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: DatabaseField;
  onMigrationComplete: () => void;
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-select' },
];

export function PropertyMigrationDialog({
  open,
  onOpenChange,
  field,
  onMigrationComplete
}: PropertyMigrationDialogProps) {
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [preview, setPreview] = useState<PropertyMigrationPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const availableTypes = propertyTypes.filter(type => 
    type.value !== field.type && isMigrationSupported(field.type, type.value)
  );

  useEffect(() => {
    if (selectedType && open) {
      loadPreview();
    } else {
      setPreview(null);
    }
  }, [selectedType, open]);

  const loadPreview = async () => {
    if (!selectedType) return;
    
    setIsLoadingPreview(true);
    try {
      const previewResult = await PropertyMigrationService.previewMigration(field, selectedType);
      setPreview(previewResult);
    } catch (error) {
      console.error('Failed to load migration preview:', error);
      toast({
        title: "Error",
        description: "Failed to load migration preview",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const executeMigration = async () => {
    if (!selectedType || !preview?.canMigrate) return;
    
    setIsExecuting(true);
    try {
      const result = await PropertyMigrationService.executeMigration(field, selectedType);
      
      if (result.success) {
        toast({
          title: "Migration Complete",
          description: `Successfully migrated ${field.name} from ${field.type} to ${selectedType}. Change logged for API consumers.`,
        });
        onMigrationComplete();
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : 'Migration failed',
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setPreview(null);
    onOpenChange(false);
  };

  const isBreakingChange = selectedType && 
    (selectedType !== field.type || (preview && preview.result.lostValues > 0));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Migrate Property Type</DialogTitle>
          <DialogDescription>
            Change the type of "{field.name}" from {field.type} to another type.
            This will convert existing values where possible and log the change for API consumers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">New Property Type</label>
            <Select value={selectedType || ''} onValueChange={(value) => setSelectedType(value as PropertyType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new type..." />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableTypes.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No migration paths are available for this property type.
              </AlertDescription>
            </Alert>
          )}

          {/* Breaking Change Warning */}
          {isBreakingChange && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="font-medium mb-1">⚠️ Breaking Change Alert</div>
                <p className="text-sm">
                  This migration will be logged as a potentially breaking change for API consumers. 
                  {preview && preview.result.lostValues > 0 && (
                    <span className="font-medium"> {preview.result.lostValues} values will be lost.</span>
                  )}
                </p>
                <div className="mt-2 text-xs">
                  <p>• All integrations using this field should be notified</p>
                  <p>• Consider versioning your API if this affects external consumers</p>
                  <p>• Update documentation and provide migration guides</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isLoadingPreview && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing migration impact...
            </div>
          )}

          {preview && !isLoadingPreview && (
            <div className="space-y-4">
              {/* Migration Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{preview.result.totalValues}</div>
                  <div className="text-sm text-muted-foreground">Total Values</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle className="h-5 w-5" />
                    {preview.result.successfulConversions}
                  </div>
                  <div className="text-sm text-muted-foreground">Will Convert</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                    <XCircle className="h-5 w-5" />
                    {preview.result.lostValues}
                  </div>
                  <div className="text-sm text-muted-foreground">Will Be Lost</div>
                </div>
              </div>

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Migration Warnings:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {preview.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Samples */}
              {(preview.result.previewSamples.successful.length > 0 || preview.result.previewSamples.failed.length > 0) && (
                <div className="space-y-3">
                  <h4 className="font-medium">Conversion Examples:</h4>
                  
                  {preview.result.previewSamples.successful.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-600 mb-2">✓ Successful Conversions</h5>
                      <div className="space-y-1">
                        {preview.result.previewSamples.successful.map((sample, index) => (
                          <div key={index} className="text-sm bg-green-50 p-2 rounded flex justify-between">
                            <span className="text-muted-foreground">"{sample.original}"</span>
                            <span>→</span>
                            <span className="font-medium">"{sample.converted}"</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {preview.result.previewSamples.failed.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-red-600 mb-2">✗ Failed Conversions</h5>
                      <div className="space-y-1">
                        {preview.result.previewSamples.failed.map((sample, index) => (
                          <div key={index} className="text-sm bg-red-50 p-2 rounded">
                            <div className="font-medium">"{sample.original}"</div>
                            <div className="text-red-600 text-xs">{sample.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={executeMigration}
            disabled={!preview?.canMigrate || isExecuting}
            className="gap-2"
            variant={isBreakingChange ? "destructive" : "default"}
          >
            {isExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isExecuting ? 'Migrating...' : (isBreakingChange ? 'Execute Breaking Migration' : 'Execute Migration')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
