
import { useState, useEffect } from 'react';

export interface Reminder {
  id: string;
  date: Date;
  title: string;
  message?: string;
  status: 'pending' | 'sent' | 'dismissed';
  pageId?: string;
  fieldId?: string;
}

export function useReminderScheduling() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Request notification permission on first use
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const scheduleReminder = (reminder: Omit<Reminder, 'id' | 'status'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
      status: 'pending'
    };

    setReminders(prev => [...prev, newReminder]);

    // Calculate time until reminder
    const timeUntilReminder = reminder.date.getTime() - Date.now();

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        triggerReminder(newReminder.id);
      }, timeUntilReminder);
    }

    return newReminder.id;
  };

  const triggerReminder = (reminderId: string) => {
    setReminders(prev => 
      prev.map(r => 
        r.id === reminderId 
          ? { ...r, status: 'sent' as const }
          : r
      )
    );

    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(reminder.title, {
        body: reminder.message || 'Reminder notification',
        icon: '/favicon.ico'
      });
    }

    // In-app notification
    setNotifications(prev => [...prev, `Reminder: ${reminder.title}`]);

    // Auto-dismiss notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const dismissReminder = (reminderId: string) => {
    setReminders(prev => 
      prev.map(r => 
        r.id === reminderId 
          ? { ...r, status: 'dismissed' as const }
          : r
      )
    );
  };

  const cancelReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const getUpcomingReminders = () => {
    return reminders
      .filter(r => r.status === 'pending' && r.date > new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return {
    reminders,
    notifications,
    scheduleReminder,
    dismissReminder,
    cancelReminder,
    getUpcomingReminders,
    hasNotificationPermission: 'Notification' in window && Notification.permission === 'granted'
  };
}
