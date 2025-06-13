
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Info,
  Clock,
  CheckCircle,
  Settings,
  Filter
} from 'lucide-react';
import { BreakingChange } from '@/types/schemaAudit';
import { formatDistanceToNow } from 'date-fns';

interface BreakingChangesAlertProps {
  breakingChanges: BreakingChange[];
  categorizedChanges: {
    high: BreakingChange[];
    medium: BreakingChange[];
    low: BreakingChange[];
  };
  config: {
    enableSmartFiltering: boolean;
    autoHideLowSeverity: boolean;
    gracePeriodHours: number;
  };
  onDismiss?: (changeId: string) => void;
  onAcknowledgeAll?: () => void;
  onConfigUpdate?: (config: any) => void;
}

export function BreakingChangesAlert({ 
  breakingChanges, 
  categorizedChanges,
  config,
  onDismiss,
  onAcknowledgeAll,
  onConfigUpdate
}: BreakingChangesAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  if (breakingChanges.length === 0) {
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

  const totalCount = breakingChanges.length;
  const highCount = categorizedChanges.high.length;
  const mediumCount = categorizedChanges.medium.length;
  const lowCount = categorizedChanges.low.length;

  // Determine alert severity based on changes
  const alertSeverity = highCount > 0 ? 'high' : mediumCount > 0 ? 'medium' : 'low';
  const alertColorClass = alertSeverity === 'high' 
    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
    : alertSeverity === 'medium'
    ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
    : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';

  return (
    <Alert className={alertColorClass}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle className="text-foreground">
          Breaking Changes Detected
          {config.enableSmartFiltering && (
            <Badge variant="outline" className="ml-2 text-xs">
              Smart Filtering
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription className="text-muted-foreground mt-1">
          {totalCount} {totalCount === 1 ? 'change' : 'changes'} detected.
          {highCount > 0 && (
            <span className="font-medium text-red-700 dark:text-red-300"> {highCount} critical</span>
          )}
          {mediumCount > 0 && (
            <span className="font-medium text-orange-700 dark:text-orange-300">
              {highCount > 0 ? ', ' : ' '}{mediumCount} moderate
            </span>
          )}
          {lowCount > 0 && !config.autoHideLowSeverity && (
            <span className="font-medium text-blue-700 dark:text-blue-300">
              {(highCount > 0 || mediumCount > 0) ? ', ' : ' '}{lowCount} minor
            </span>
          )}
        </AlertDescription>
        
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            View Details ({totalCount})
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="gap-2"
          >
            <Settings className="h-3 w-3" />
            Settings
          </Button>
          
          {totalCount > 1 && onAcknowledgeAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAcknowledgeAll}
              className="gap-2"
            >
              <CheckCircle className="h-3 w-3" />
              Acknowledge All
            </Button>
          )}
        </div>

        {showConfig && (
          <div className="mt-4 p-3 bg-background border rounded-md space-y-3">
            <h4 className="font-medium text-sm">Breaking Change Detection Settings</h4>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="smart-filtering"
                checked={config.enableSmartFiltering}
                onCheckedChange={(checked) => onConfigUpdate?.({ enableSmartFiltering: checked })}
              />
              <Label htmlFor="smart-filtering" className="text-sm">
                Enable smart filtering (ignore development changes)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-hide-low"
                checked={config.autoHideLowSeverity}
                onCheckedChange={(checked) => onConfigUpdate?.({ autoHideLowSeverity: checked })}
              />
              <Label htmlFor="auto-hide-low" className="text-sm">
                Auto-hide low severity changes
              </Label>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Smart filtering considers field age, creation/deletion timing, and development patterns to reduce false positives.
            </p>
          </div>
        )}

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {/* High severity changes first */}
            {categorizedChanges.high.map((change) => (
              <div 
                key={change.id}
                className="bg-white dark:bg-gray-900/50 border border-red-200 dark:border-red-800 rounded-md p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(change.severity)}
                      <Badge variant={getSeverityColor(change.severity)} className="text-xs">
                        {change.severity.toUpperCase()} PRIORITY
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
                  
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(change.id)}
                      className="p-1 h-auto text-muted-foreground hover:text-foreground ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Medium and low severity changes */}
            {[...categorizedChanges.medium, ...categorizedChanges.low].map((change) => (
              <div 
                key={change.id}
                className="bg-white dark:bg-gray-900/50 border rounded-md p-3"
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
                    
                    <p className="text-xs text-muted-foreground">
                      {change.impact}
                    </p>
                  </div>
                  
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(change.id)}
                      className="p-1 h-auto text-muted-foreground hover:text-foreground ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Alert>
  );
}
