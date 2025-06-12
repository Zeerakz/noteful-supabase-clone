
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Link,
  Mail,
  Phone,
  Tag,
  Tags,
  File,
  Image as ImageIcon,
  Calculator,
  Database,
  TrendingUp,
  Users,
  Star,
  BarChart3,
  DollarSign,
  Info
} from 'lucide-react';
import { PropertyType } from '@/types/property';
import { RegistryBasedPropertyConfigEditor } from '@/components/property/RegistryBasedPropertyConfigEditor';

interface NewPropertyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyCreate: (property: { name: string; type: PropertyType; settings?: any }) => Promise<void>;
  workspaceId?: string;
}

const propertyTypeDefinitions = {
  text: {
    icon: Type,
    label: 'Text',
    description: 'Single line text input for names, titles, and short descriptions',
    help: 'Perfect for storing names, titles, short descriptions, or any text that fits on one line.',
    category: 'Basic',
    defaults: { required: false, placeholder: 'Enter text...' }
  },
  number: {
    icon: Hash,
    label: 'Number',
    description: 'Numeric values with formatting options',
    help: 'Store numbers, quantities, prices, or any numeric data. Supports formatting as integers, decimals, or percentages.',
    category: 'Basic',
    defaults: { required: false, format: 'decimal', precision: 2 }
  },
  select: {
    icon: Tag,
    label: 'Select',
    description: 'Single choice from predefined options',
    help: 'Choose one option from a list. Great for categories, status, priority, or any single-choice field.',
    category: 'Basic',
    defaults: { 
      required: false, 
      options: [
        { id: '1', name: 'Option 1', color: '#3b82f6' },
        { id: '2', name: 'Option 2', color: '#10b981' },
        { id: '3', name: 'Option 3', color: '#f59e0b' }
      ]
    }
  },
  multi_select: {
    icon: Tags,
    label: 'Multi-select',
    description: 'Multiple choices from predefined options',
    help: 'Select multiple options from a list. Perfect for tags, skills, categories, or any multi-choice field.',
    category: 'Basic',
    defaults: { 
      required: false, 
      allowMultiple: true,
      options: [
        { id: '1', name: 'Tag 1', color: '#3b82f6' },
        { id: '2', name: 'Tag 2', color: '#10b981' },
        { id: '3', name: 'Tag 3', color: '#f59e0b' }
      ]
    }
  },
  date: {
    icon: Calendar,
    label: 'Date',
    description: 'Date picker without time',
    help: 'Store dates like deadlines, birthdays, or event dates. Displays as a clean date without time.',
    category: 'Basic',
    defaults: { required: false, includeTime: false, format: 'relative' }
  },
  datetime: {
    icon: Calendar,
    label: 'Date & Time',
    description: 'Date picker with time',
    help: 'Store specific moments in time like meeting times, created dates, or any time-sensitive data.',
    category: 'Basic',
    defaults: { required: false, includeTime: true, format: 'relative' }
  },
  checkbox: {
    icon: CheckSquare,
    label: 'Checkbox',
    description: 'True/false toggle',
    help: 'Simple yes/no, true/false, or completed/incomplete fields. Perfect for task completion or feature flags.',
    category: 'Basic',
    defaults: { required: false, defaultValue: false }
  },
  url: {
    icon: Link,
    label: 'URL',
    description: 'Website links with click-to-open',
    help: 'Store website URLs, social media links, or any web address. Automatically formats as clickable links.',
    category: 'Advanced',
    defaults: { required: false, displayAs: 'link' }
  },
  email: {
    icon: Mail,
    label: 'Email',
    description: 'Email addresses with validation',
    help: 'Store email addresses with automatic validation. Perfect for contact information or user accounts.',
    category: 'Advanced',
    defaults: { required: false }
  },
  phone: {
    icon: Phone,
    label: 'Phone',
    description: 'Phone numbers with formatting',
    help: 'Store phone numbers with automatic formatting. Supports international and local number formats.',
    category: 'Advanced',
    defaults: { required: false, format: 'international' }
  },
  people: {
    icon: Users,
    label: 'People',
    description: 'Assign team members or users',
    help: 'Assign people from your workspace to tasks, projects, or any record. Great for collaboration and accountability.',
    category: 'Relationship',
    defaults: { required: false, allowMultiple: false, restrictToWorkspace: true }
  },
  relation: {
    icon: Database,
    label: 'Relation',
    description: 'Link to other database records',
    help: 'Connect records across databases. Create relationships between projects, tasks, contacts, or any data.',
    category: 'Relationship',
    defaults: { required: false, allowMultiple: false, targetDatabaseId: '' }
  },
  formula: {
    icon: Calculator,
    label: 'Formula',
    description: 'Calculated values based on other fields',
    help: 'Create calculated fields using formulas. Automatically compute values based on other properties in the record.',
    category: 'Computed',
    defaults: { required: false, formula: '', returnType: 'text' }
  },
  rollup: {
    icon: TrendingUp,
    label: 'Rollup',
    description: 'Aggregate data from related records',
    help: 'Summarize data from related records. Calculate totals, averages, counts, or other aggregations across relationships.',
    category: 'Computed',
    defaults: { required: false, relationFieldId: '', targetPropertyId: '', aggregation: 'count' }
  },
  file_attachment: {
    icon: File,
    label: 'File',
    description: 'Upload and attach files',
    help: 'Attach documents, images, or any files to records. Supports multiple file types and preview capabilities.',
    category: 'Media',
    defaults: { required: false, maxFiles: 10, displayAs: 'list' }
  },
  image: {
    icon: ImageIcon,
    label: 'Image',
    description: 'Upload and display images',
    help: 'Specifically for images with thumbnail previews. Perfect for avatars, product photos, or visual content.',
    category: 'Media',
    defaults: { required: false, maxFiles: 5, displayAs: 'gallery' }
  },
  rating: {
    icon: Star,
    label: 'Rating',
    description: 'Star ratings or numeric scores',
    help: 'Rate items with stars, numbers, or custom scales. Great for reviews, priorities, or quality scores.',
    category: 'Advanced',
    defaults: { required: false, scale: 5, style: 'stars', allowHalf: false }
  },
  progress: {
    icon: BarChart3,
    label: 'Progress',
    description: 'Progress bars and completion tracking',
    help: 'Track completion percentage or progress towards goals. Displays as progress bars or percentage indicators.',
    category: 'Advanced',
    defaults: { required: false, min: 0, max: 100, displayAs: 'bar', showPercentage: true }
  },
  currency: {
    icon: DollarSign,
    label: 'Currency',
    description: 'Monetary values with currency formatting',
    help: 'Store prices, budgets, or any monetary values with proper currency formatting and symbols.',
    category: 'Advanced',
    defaults: { required: false, currency: 'USD', precision: 2, symbolPosition: 'before' }
  }
};

const categories = [
  { key: 'Basic', label: 'Basic Types', description: 'Essential field types for everyday use' },
  { key: 'Advanced', label: 'Advanced Types', description: 'Specialized fields with rich formatting' },
  { key: 'Relationship', label: 'Relationships', description: 'Connect and reference other data' },
  { key: 'Computed', label: 'Computed Fields', description: 'Automatically calculated values' },
  { key: 'Media', label: 'Media & Files', description: 'Upload and display files and images' }
];

export function NewPropertyWizard({ 
  open, 
  onOpenChange, 
  onPropertyCreate,
  workspaceId = ''
}: NewPropertyWizardProps) {
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [propertyName, setPropertyName] = useState('');
  const [propertyConfig, setPropertyConfig] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);

  const handleTypeSelect = (type: PropertyType) => {
    setSelectedType(type);
    setPropertyConfig(propertyTypeDefinitions[type]?.defaults || {});
    setStep('config');
  };

  const handleCreate = async () => {
    if (!selectedType || !propertyName.trim()) return;

    setIsCreating(true);
    try {
      await onPropertyCreate({
        name: propertyName.trim(),
        type: selectedType,
        settings: propertyConfig
      });
      
      // Reset form
      setStep('type');
      setSelectedType(null);
      setPropertyName('');
      setPropertyConfig({});
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create property:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (step === 'config') {
      setStep('type');
    }
  };

  const selectedDefinition = selectedType ? propertyTypeDefinitions[selectedType] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'type' ? (
              'Choose Property Type'
            ) : (
              <>
                {selectedDefinition && <selectedDefinition.icon className="h-5 w-5" />}
                Configure {selectedDefinition?.label} Property
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'type' && (
            <>
              <div className="text-sm text-muted-foreground">
                Select the type of property you want to create. Each type is designed for specific kinds of data.
              </div>

              <ScrollArea className="h-[60vh]">
                <div className="space-y-6">
                  {categories.map((category) => {
                    const typesInCategory = Object.entries(propertyTypeDefinitions).filter(
                      ([, def]) => def.category === category.key
                    );

                    if (typesInCategory.length === 0) return null;

                    return (
                      <div key={category.key} className="space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm">{category.label}</h3>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {typesInCategory.map(([type, definition]) => {
                            const IconComponent = definition.icon;
                            return (
                              <div
                                key={type}
                                className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary transition-colors group"
                                onClick={() => handleTypeSelect(type as PropertyType)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                                    <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                  </div>
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="font-medium text-sm">{definition.label}</div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">
                                      {definition.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          {step === 'config' && selectedDefinition && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {selectedDefinition.help}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="property-name">Property Name</Label>
                  <Input
                    id="property-name"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    placeholder={`Enter ${selectedDefinition.label.toLowerCase()} name`}
                    autoFocus
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Configuration</h4>
                  <RegistryBasedPropertyConfigEditor
                    propertyType={selectedType!}
                    config={propertyConfig}
                    onConfigChange={setPropertyConfig}
                    workspaceId={workspaceId}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!propertyName.trim() || isCreating}
                  className="flex-1"
                >
                  {isCreating ? 'Creating...' : `Create ${selectedDefinition.label} Property`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
