
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ContentTypeIcon } from './ContentTypeIcon';
import { ContentType, ContentTypeUtils, ContentCategory } from '@/types/contentTypes';
import { Info, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

/**
 * ContentTypeGuidelines component for displaying usage guidelines
 * 
 * This component serves as documentation and reference for how to properly
 * use content type icons and maintain hierarchy in the navigation system.
 */
export function ContentTypeGuidelines() {
  const coreTypes = ContentTypeUtils.getTypesByCategory(ContentCategory.CORE);
  const pageTypes = ContentTypeUtils.getTypesByCategory(ContentCategory.PAGES);
  const databaseTypes = ContentTypeUtils.getTypesByCategory(ContentCategory.DATABASES);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Type Guidelines</h2>
        <p className="text-muted-foreground">
          Guidelines for using content type icons to maintain a clean and consistent navigation hierarchy.
        </p>
      </div>

      {/* Core Principles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Core Principles
          </CardTitle>
          <CardDescription>
            Fundamental rules for content type differentiation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>First-Level Only:</strong> Icons should only be used for first-level navigation items to maintain a clean hierarchy. Child items use simpler indicators.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Semantic Consistency:</strong> Each content type has a specific icon that should be used consistently across the application.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Color Coding:</strong> Content types use semantic colors to provide additional visual differentiation (blue for pages, purple for databases, etc.).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Hierarchy Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Hierarchy Rules</CardTitle>
          <CardDescription>
            How to apply icons at different levels of the navigation tree
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Correct Usage
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <ContentTypeIcon contentType={ContentType.PROJECT} size="sm" />
                  <span>Project Alpha (First level - has icon)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded ml-4">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span>Task 1 (Second level - simple indicator)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded ml-8">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span>Subtask A (Third level - smaller indicator)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-red-700 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Incorrect Usage
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                  <ContentTypeIcon contentType={ContentType.PROJECT} size="sm" />
                  <span>Project Alpha (First level)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded ml-4">
                  <ContentTypeIcon contentType={ContentType.TASK_LIST} size="sm" />
                  <span className="line-through">Task 1 (Avoid icons at this level)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded ml-8">
                  <ContentTypeIcon contentType={ContentType.PAGE} size="sm" />
                  <span className="line-through">Subtask A (Definitely avoid here)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Type Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Content Type Categories</CardTitle>
          <CardDescription>
            Overview of available content types organized by category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Core Types */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              Core Types
              <Badge variant="secondary">Most Common</Badge>
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {coreTypes.map((type) => (
                <div key={type} className="flex items-center gap-2 p-2 border rounded">
                  <ContentTypeIcon contentType={type} size="sm" />
                  <span className="text-sm">{ContentTypeUtils.getLabel(type)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Page Types */}
          <div>
            <h4 className="font-semibold mb-3">Specialized Page Types</h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pageTypes.map((type) => (
                <div key={type} className="flex items-center gap-2 p-2 border rounded">
                  <ContentTypeIcon contentType={type} size="sm" />
                  <span className="text-sm">{ContentTypeUtils.getLabel(type)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Database Types */}
          <div>
            <h4 className="font-semibold mb-3">Database Types</h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {databaseTypes.map((type) => (
                <div key={type} className="flex items-center gap-2 p-2 border rounded">
                  <ContentTypeIcon contentType={type} size="sm" />
                  <span className="text-sm">{ContentTypeUtils.getLabel(type)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guidelines</CardTitle>
          <CardDescription>
            Technical guidelines for developers implementing content type differentiation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Component Usage</h4>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              <div>{`<ContentTypeIcon contentType={ContentType.PROJECT} size="md" />`}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Type Selection</h4>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              <div>{`<ContentTypeSelector`}</div>
              <div>{`  selectedType={selectedType}`}</div>
              <div>{`  onTypeChange={setSelectedType}`}</div>
              <div>{`  context="workspace"`}</div>
              <div>{`/>`}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Best Practices</h4>
            <ul className="space-y-1 text-sm">
              <li>• Always provide fallback icons for unknown content types</li>
              <li>• Use consistent sizing across similar UI components</li>
              <li>• Include tooltips for accessibility when appropriate</li>
              <li>• Consider color contrast in different themes</li>
              <li>• Test icon visibility at different screen sizes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
