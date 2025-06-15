
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UsersRound } from 'lucide-react';

export function GroupsManagementTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Groups</CardTitle>
        <CardDescription>
          Create and manage user groups to easily mention and assign multiple people at once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
          <UsersRound className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">Coming Soon</h3>
          <p className="mt-1 text-sm text-muted-foreground">Group management functionality will be available here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
