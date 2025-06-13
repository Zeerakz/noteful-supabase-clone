
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  Inbox, 
  FileText, 
  Database, 
  Bookmark,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { NavigationHierarchyService, NavigationItem } from '@/services/navigationHierarchyService';
import { cn } from '@/lib/utils';

const navigationIcons = {
  workspace: Home,
  search: Search,
  inbox: Inbox,
  pages: FileText,
  databases: Database,
  templates: Bookmark,
  mentions: UserCheck,
  assignments: UserCheck,
  deadlines: Calendar
};

const typeColors = {
  destination: 'bg-blue-50 text-blue-700 border-blue-200',
  tool: 'bg-green-50 text-green-700 border-green-200',
  filter: 'bg-purple-50 text-purple-700 border-purple-200',
  context: 'bg-orange-50 text-orange-700 border-orange-200'
};

interface NavigationItemCardProps {
  item: NavigationItem;
  level?: number;
  onClick?: (item: NavigationItem) => void;
}

function NavigationItemCard({ item, level = 0, onClick }: NavigationItemCardProps) {
  const Icon = navigationIcons[item.id as keyof typeof navigationIcons] || AlertCircle;
  
  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        level > 0 && "ml-6 border-l-2 border-muted"
      )}
      onClick={() => onClick?.(item)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-base">{item.label}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge 
              variant="outline" 
              className={cn("text-xs", typeColors[item.type])}
            >
              {item.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {item.scope}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm">
          {item.purpose}
        </CardDescription>
        
        {item.children && item.children.length > 0 && (
          <div className="mt-4 space-y-2">
            {item.children.map((child) => (
              <NavigationItemCard 
                key={child.id} 
                item={child} 
                level={level + 1}
                onClick={onClick}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CoreNavigationModel() {
  const navigate = useNavigate();
  const location = useLocation();
  const hierarchy = NavigationHierarchyService.getNavigationHierarchy();
  const validation = NavigationHierarchyService.validateNavigationStructure();

  const handleNavigationClick = (item: NavigationItem) => {
    switch (item.id) {
      case 'workspace':
        navigate('/');
        break;
      case 'search':
        // This would trigger global search
        console.log('Opening global search...');
        break;
      case 'inbox':
        // This would show inbox view
        console.log('Opening inbox...');
        break;
      default:
        console.log(`Navigating to: ${item.label}`);
    }
  };

  const getIntentRecommendation = (intent: 'create' | 'find' | 'review' | 'organize') => {
    const recommendation = NavigationHierarchyService.getNavigationFlow(intent);
    return recommendation;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Core Navigation Hierarchy</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A re-evaluated model that clarifies the relationship between your content, tools, and filters.
          Each item has a defined purpose and scope to create a clearer mental model.
        </p>
      </div>

      {/* Validation Status */}
      <Card className={cn(
        "border-2",
        validation.isValid ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validation.isValid ? (
              <div className="h-2 w-2 rounded-full bg-green-500" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            )}
            Navigation Structure Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validation.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-amber-700 mb-2">Issues Found:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-600">
                {validation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                {validation.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.isValid && (
            <p className="text-green-700 text-sm">
              ✅ Navigation hierarchy follows best practices with clear separation of destinations, tools, and filters.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Intent-Based Navigation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation by Intent</CardTitle>
          <CardDescription>
            Choose your starting point based on what you want to accomplish
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['create', 'find', 'review', 'organize'] as const).map((intent) => {
              const recommendation = getIntentRecommendation(intent);
              const Icon = navigationIcons[recommendation.id as keyof typeof navigationIcons] || AlertCircle;
              
              return (
                <Button
                  key={intent}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => handleNavigationClick(recommendation)}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium capitalize">{intent}</div>
                    <div className="text-xs text-muted-foreground">
                      → {recommendation.label}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Structure */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Navigation Hierarchy</h2>
        <div className="space-y-4">
          {hierarchy.map((item) => (
            <NavigationItemCard 
              key={item.id} 
              item={item} 
              onClick={handleNavigationClick}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Type Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Badge className={typeColors.destination}>Destination</Badge>
              <p className="text-sm text-muted-foreground">
                Primary content containers where your information lives
              </p>
            </div>
            <div className="space-y-2">
              <Badge className={typeColors.tool}>Tool</Badge>
              <p className="text-sm text-muted-foreground">
                Universal utilities that work across all content
              </p>
            </div>
            <div className="space-y-2">
              <Badge className={typeColors.filter}>Filter</Badge>
              <p className="text-sm text-muted-foreground">
                Contextual views that surface relevant content
              </p>
            </div>
            <div className="space-y-2">
              <Badge className={typeColors.context}>Context</Badge>
              <p className="text-sm text-muted-foreground">
                Situational items that appear based on current state
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
