import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useUnreadCount() {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    // Don't fetch if session is not ready or user is not authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }
    
    try {
      // Only fetch messages for the Messages badge
      const messagesResponse = await fetch('/api/messages?status=received', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      let totalUnread = 0;

      // Process messages only
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const messages = messagesData.messages || [];
        const unreadMessages = messages.filter((m: any) => !m.isRead && m.isToMe);
        totalUnread += unreadMessages.length;
      } else if (messagesResponse.status !== 401) {
        throw new Error(`Messages API error! status: ${messagesResponse.status}`);
      }

      setUnreadCount(totalUnread);
    } catch (error) {
      // Only log errors that aren't network-related (which can happen during normal operation)
      if (error instanceof Error && !error.message.includes('Failed to fetch')) {
        console.error('Error fetching unread count:', error);
      }
      // Don't set unreadCount to 0 on error, keep the previous value
    }
  }, [session?.user?.id, status]);

  useEffect(() => {
    // Only set up polling if session is authenticated
    if (status === 'authenticated') {
      fetchUnreadCount();
      
      // TEMPORARILY DISABLED: Set up polling to update unread count every 2 minutes (reduced frequency for development)
      // const interval = setInterval(fetchUnreadCount, 120000);
      
      return () => {
        // clearInterval(interval);
      };
    }
  }, [status, fetchUnreadCount]);

  // Expose refresh function for manual updates
  const refreshUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return { unreadCount, refreshUnreadCount };
}
