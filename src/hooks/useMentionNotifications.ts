
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMentionNotifications() {
  const { user } = useAuth();

  const sendMentionNotification = async (
    mentionedUserEmail: string,
    commentBody: string,
    pageTitle: string,
    pageUrl: string
  ) => {
    if (!user) return;

    try {
      // Get the current user's name (you might want to store this in profiles table)
      const mentionerName = user.email?.split('@')[0] || 'Someone';

      const { error } = await supabase.functions.invoke('send-mention-notification', {
        body: {
          mentionedUserEmail,
          mentionerName,
          commentBody,
          pageTitle,
          pageUrl,
        },
      });

      if (error) {
        console.error('Failed to send mention notification:', error);
        throw error;
      }

      console.log('Mention notification sent successfully');
    } catch (error) {
      console.error('Error sending mention notification:', error);
      throw error;
    }
  };

  const extractMentions = (text: string): string[] => {
    // Updated regex to detect @email patterns more accurately
    const mentionRegex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  };

  const notifyMention = async (
    mentionedEmails: string[],
    commentBody: string,
    pageTitle: string,
    pageUrl: string
  ) => {
    if (!mentionedEmails.length) return;

    const notificationPromises = mentionedEmails.map(email =>
      sendMentionNotification(email, commentBody, pageTitle, pageUrl)
    );

    try {
      await Promise.allSettled(notificationPromises);
    } catch (error) {
      console.error('Error sending mention notifications:', error);
    }
  };

  return {
    sendMentionNotification,
    extractMentions,
    notifyMention,
  };
}
