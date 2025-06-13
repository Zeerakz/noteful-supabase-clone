
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Database, 
  Plus, 
  Minus, 
  Edit3, 
  RotateCcw, 
  User,
  FileText
} from 'lucide-react';
import { SchemaAuditLog } from '@/types/schemaAudit';
import { formatDistanceToNow, format } from 'date-fns';

interface SchemaAuditPanelProps {
  auditLogs: SchemaAuditLog[];
  loading?: boolean;
}

export function SchemaAuditPanel({ auditLogs, loading }: SchemaAuditPanelProps) {
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'field_created':
      case 'database_created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'field_deleted':
      case 'database_deleted':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'field_updated':
        return <Edit3 className="h-4 w-4 text-blue-600" />;
      case 'field_renamed':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'field_created':
      case 'database_created':
        return 'default';
      case 'field_deleted':
      case 'database_deleted':
        return 'destructive';
      case 'field_updated':
        return 'default';
      case 'field_renamed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatChangeDescription = (log: SchemaAuditLog) => {
    const fieldName = log.new_values?.name || log.old_values?.name || 'Unknown';
    
    switch (log.change_type) {
      case 'field_created':
        return `Created field "${fieldName}" (${log.new_values?.type})`;
      case 'field_deleted':
        return `Deleted field "${fieldName}" (${log.old_values?.type})`;
      case 'field_updated':
        if (log.old_values?.type !== log.new_values?.type) {
          return `Changed field "${fieldName}" type from ${log.old_values?.type} to ${log.new_values?.type}`;
        }
        return `Updated field "${fieldName}" settings`;
      case 'field_renamed':
        return `Renamed field from "${log.old_values?.name}" to "${log.new_values?.name}"`;
      case 'database_created':
        return `Created database "${log.new_values?.name}"`;
      case 'database_deleted':
        return `Deleted database "${log.old_values?.name}"`;
      default:
        return `${log.change_type} on ${fieldName}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schema Change History
          </CardTitle>
          <CardDescription>
            Track all schema changes for API compatibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Schema Change History
        </CardTitle>
        <CardDescription>
          Track all schema changes for API compatibility and breaking change analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No schema changes recorded yet</p>
              <p className="text-sm">Changes will appear here when you modify the database structure</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log, index) => (
                <div key={log.id}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getChangeIcon(log.change_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getChangeColor(log.change_type)} className="text-xs">
                          {log.change_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium mb-1">
                        {formatChangeDescription(log)}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>System</span>
                        <span>•</span>
                        <span>{format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                      
                      {(log.old_values || log.new_values) && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            {log.old_values && (
                              <div className="mb-2">
                                <span className="font-medium">Previous:</span>
                                <pre className="mt-1 whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <span className="font-medium">Current:</span>
                                <pre className="mt-1 whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                  
                  {index < auditLogs.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
