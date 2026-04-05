import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useNotificationCount() {
  const { data: session, status } = useSession();
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotificationCount = useCallback(async () => {
    // Don't fetch if session is not ready or user is not authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }
    
    try {
      // Only fetch notifications
      const notificationsResponse = await fetch('/api/notifications/unread-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        const unreadNotifications = notificationsData.unreadCount || 0;
        console.log('Unread notifications count:', unreadNotifications);
        setNotificationCount(unreadNotifications);
      } else if (notificationsResponse.status !== 401) {
        console.error(`Notifications API error! status: ${notificationsResponse.status}`);
        // Try to get more error details
        const errorText = await notificationsResponse.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      // Only log errors that aren't network-related (which can happen during normal operation)
      if (error instanceof Error && !error.message.includes('Failed to fetch')) {
        console.error('Error fetching notification count:', error);
      }
      // Don't set notificationCount to 0 on error, keep the previous value
    }
  }, [session?.user?.id, status]);

  useEffect(() => {
    // Only set up polling if session is authenticated
    if (status === 'authenticated') {
      fetchNotificationCount();
      
      // TEMPORARILY DISABLED: Set up polling to update notification count every 2 minutes
      // const interval = setInterval(fetchNotificationCount, 120000);
      
      return () => {
        // clearInterval(interval);
      };
    }
  }, [status, fetchNotificationCount]);

  // Expose refresh function for manual updates
  const refreshNotificationCount = useCallback(() => {
    fetchNotificationCount();
  }, [fetchNotificationCount]);

  return { notificationCount, refreshNotificationCount };
}
