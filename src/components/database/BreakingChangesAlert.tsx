
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Info,
  Clock
} from 'lucide-react';
import { BreakingChange } from '@/types/schemaAudit';
import { formatDistanceToNow } from 'date-fns';

interface BreakingChangesAlertProps {
  breakingChanges: BreakingChange[];
  onDismiss?: (changeId: string) => void;
  onAcknowledgeAll?: () => void;
}

export function BreakingChangesAlert({ 
  breakingChanges, 
  onDismiss,
  onAcknowledgeAll 
}: BreakingChangesAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedChanges, setDismissedChanges] = useState<Set<string>>(new Set());

  const visibleChanges = breakingChanges.filter(change => !dismissedChanges.has(change.id));

  const handleDismiss = (changeId: string) => {
    setDismissedChanges(prev => new Set([...prev, changeId]));
    if (onDismiss) {
      onDismiss(changeId);
    }
  };

  const handleAcknowledgeAll = () => {
    const allChangeIds = breakingChanges.map(change => change.id);
    setDismissedChanges(new Set(allChangeIds));
    if (onAcknowledgeAll) {
      onAcknowledgeAll();
    }
  };

  if (visibleChanges.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <Info className="h-4 w-4 text-orange-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <div className="flex-1">
        <AlertTitle className="text-orange-800 dark:text-orange-200">
          Breaking Changes Detected
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-300 mt-1">
          {visibleChanges.length} {visibleChanges.length === 1 ? 'high severity change' : 'changes'} detected that may affect API consumers.
        </AlertDescription>
        
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2 border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900/20"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            View Details ({visibleChanges.length})
          </Button>
          
          {visibleChanges.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcknowledgeAll}
              className="gap-2 border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900/20"
            >
              Acknowledge All
            </Button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {visibleChanges.map((change) => (
              <div 
                key={change.id}
                className="bg-white dark:bg-gray-900/50 border border-orange-200 dark:border-orange-800 rounded-md p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(change.severity)}
                      <Badge variant={getSeverityColor(change.severity)} className="text-xs">
                        {change.severity.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-sm text-foreground mb-1">
                      {change.description}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {change.impact}
                    </p>
                    
                    {change.migration_guide && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2 mt-2">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Migration Guide:
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {change.migration_guide}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(change.id)}
                    className="p-1 h-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Alert>
  );
}
