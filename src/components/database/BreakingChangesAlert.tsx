
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { BreakingChange } from '@/types/schemaAudit';
import { formatDistanceToNow } from 'date-fns';

interface BreakingChangesAlertProps {
  breakingChanges: BreakingChange[];
  className?: string;
}

export function BreakingChangesAlert({ breakingChanges, className }: BreakingChangesAlertProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (breakingChanges.length === 0) {
    return null;
  }

  const highSeverityCount = breakingChanges.filter(change => change.severity === 'high').length;
  const mediumSeverityCount = breakingChanges.filter(change => change.severity === 'medium').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        Breaking Changes Detected
      </AlertTitle>
      <AlertDescription className="text-orange-700">
        <div className="mt-2 space-y-2">
          <p>
            {highSeverityCount > 0 && (
              <span>{highSeverityCount} high severity</span>
            )}
            {highSeverityCount > 0 && mediumSeverityCount > 0 && <span>, </span>}
            {mediumSeverityCount > 0 && (
              <span>{mediumSeverityCount} medium severity</span>
            )}
            {' changes detected that may affect API consumers.'}
          </p>
          
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="text-orange-700 border-orange-300">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                View Details ({breakingChanges.length})
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="space-y-3">
                {breakingChanges.slice(0, 10).map((change) => (
                  <div
                    key={change.id}
                    className="bg-white border border-orange-200 rounded-md p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(change.severity)}>
                          {change.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {change.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">{change.description}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{change.impact}</p>
                    
                    {change.migration_guide && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs font-medium text-blue-800 mb-1">Migration Guide:</p>
                        <p className="text-xs text-blue-700">{change.migration_guide}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {breakingChanges.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    And {breakingChanges.length - 10} more changes...
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </AlertDescription>
    </Alert>
  );
}
