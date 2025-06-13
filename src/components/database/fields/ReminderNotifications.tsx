
import React from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReminderScheduling } from '@/hooks/useReminderScheduling';
import { format } from 'date-fns';

export function ReminderNotifications() {
  const { notifications, getUpcomingReminders, dismissReminder, cancelReminder } = useReminderScheduling();
  const upcomingReminders = getUpcomingReminders();

  if (notifications.length === 0 && upcomingReminders.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Active notifications */}
      {notifications.map((notification, index) => (
        <Card key={index} className="p-3 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-2">
            <Bell className="h-4 w-4 text-yellow-600 mt-0.5" />
            <span className="text-sm text-yellow-800">{notification}</span>
          </div>
        </Card>
      ))}

      {/* Upcoming reminders */}
      {upcomingReminders.length > 0 && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Upcoming Reminders</span>
            </div>
            {upcomingReminders.slice(0, 3).map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-blue-900">{reminder.title}</div>
                  <div className="text-blue-700">{format(reminder.date, 'MMM d, h:mm a')}</div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissReminder(reminder.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {upcomingReminders.length > 3 && (
              <div className="text-xs text-blue-700">
                +{upcomingReminders.length - 3} more reminders
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
