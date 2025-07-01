'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAdvancedPolling } from './useAdvancedPolling';
import { useNotifications } from '@/components/realtime/NotificationSystem';

interface EmailMessage {
  id: string;
  temp_email_id: string;
  sender: string;
  subject: string;
  body_text: string;
  body_html: string;
  received_at: string;
  is_read: boolean;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
  }>;
}

interface MessageStats {
  total: number;
  unread: number;
  last_received: string | null;
}

interface RealtimeMessageData {
  messages: EmailMessage[];
  stats: MessageStats;
  email_address: string;
}

export function useRealtimeMessages(emailId: string, emailAddress?: string) {
  const [previousMessageCount, setPreviousMessageCount] = useState<number>(0);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const { notifyNewMessage } = useNotifications();
  const hasInitializedRef = useRef(false);

  // Advanced polling for message updates
  const {
    data: messageData,
    loading,
    error,
    isPolling,
    isOnline,
    consecutiveErrors,
    lastSuccessTime,
    lastErrorTime,
    startPolling,
    stopPolling,
    forcePoll
  } = useAdvancedPolling<RealtimeMessageData>(
    async () => {
      if (!emailId) {
        return {
          messages: [],
          stats: { total: 0, unread: 0, last_received: null },
          email_address: emailAddress || ''
        };
      }

      const response = await fetch(`/api/emails/${emailId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        messages: data.messages || [],
        stats: {
          total: data.messages?.length || 0,
          unread: data.messages?.filter((m: EmailMessage) => !m.is_read).length || 0,
          last_received: data.messages?.length > 0 ? data.messages[0].received_at : null
        },
        email_address: emailAddress || data.email_address || ''
      };
    },
    {
      baseInterval: 5000, // Check every 5 seconds for new messages
      maxInterval: 60000, // Max 1 minute between checks
      maxRetries: 5,
      isOnlinePollingEnabled: true,
    }
  );

  const messages = messageData?.messages || [];
  const stats = messageData?.stats || { total: 0, unread: 0, last_received: null };

  // Detect new messages and trigger notifications
  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Set initial state without triggering notifications
      if (messages.length > 0) {
        setPreviousMessageCount(messages.length);
      }
      hasInitializedRef.current = true;
      return;
    }

    if (messages.length > previousMessageCount) {
      const newMessages = messages.slice(0, messages.length - previousMessageCount);
      
      // Notify about each new message
      newMessages.forEach((message) => {
        notifyNewMessage(
          messageData?.email_address || emailAddress || 'Unknown',
          message.sender,
          message.subject
        );
      });

      setPreviousMessageCount(messages.length);
    }
  }, [messages.length, previousMessageCount, messageData?.email_address, emailAddress, notifyNewMessage]);

  // Auto-start polling when emailId is provided
  useEffect(() => {
    if (emailId) {
      startPolling();
      return () => stopPolling();
    }
  }, [emailId, startPolling, stopPolling]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/messages/${messageId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Force refresh to get updated read status
        await forcePoll();
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, [emailId, forcePoll]);

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`/api/emails/${emailId}/messages/read-all`, {
        method: 'PATCH',
      });

      if (response.ok) {
        await forcePoll();
      }
    } catch (err) {
      console.error('Failed to mark all messages as read:', err);
    }
  }, [emailId, forcePoll]);

  // Get unread messages
  const unreadMessages = messages.filter(message => !message.is_read);

  // Get messages received since last check
  const newMessagesSinceLastCheck = messages.filter(message => 
    new Date(message.received_at).getTime() > lastCheckTime
  );

  // Update last check time
  const updateLastCheckTime = useCallback(() => {
    setLastCheckTime(Date.now());
  }, []);

  // Get formatted message preview
  const getMessagePreview = useCallback((message: EmailMessage, maxLength = 100) => {
    const text = message.body_text || message.subject || 'No content';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  // Check if email has recent activity (within last 5 minutes)
  const hasRecentActivity = stats.last_received && 
    (Date.now() - new Date(stats.last_received).getTime()) < 5 * 60 * 1000;

  return {
    // Message data
    messages,
    unreadMessages,
    newMessagesSinceLastCheck,
    stats,
    
    // State
    loading,
    error,
    isPolling,
    isOnline,
    consecutiveErrors,
    lastSuccessTime,
    lastErrorTime,
    hasRecentActivity,
    
    // Actions
    startPolling,
    stopPolling,
    forcePoll,
    markAsRead,
    markAllAsRead,
    updateLastCheckTime,
    getMessagePreview,
  };
}

// Hook for monitoring multiple emails simultaneously
export function useMultiEmailMessages(emailIds: string[]) {
  const [allMessages, setAllMessages] = useState<Record<string, EmailMessage[]>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const { notifyNewMessage } = useNotifications();

  // Track individual email message hooks
  const emailHooks = emailIds.map(emailId => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRealtimeMessages(emailId);
  });

  // Aggregate all messages and stats
  useEffect(() => {
    const messagesMap: Record<string, EmailMessage[]> = {};
    let unreadCount = 0;

    emailHooks.forEach((hook, index) => {
      const emailId = emailIds[index];
      messagesMap[emailId] = hook.messages;
      unreadCount += hook.stats.unread;
    });

    setAllMessages(messagesMap);
    setTotalUnread(unreadCount);
  }, [emailHooks, emailIds]);

  // Get all messages sorted by received date
  const getAllMessagesSorted = useCallback(() => {
    const allMsgs: EmailMessage[] = [];
    Object.values(allMessages).forEach(messages => {
      allMsgs.push(...messages);
    });
    
    return allMsgs.sort((a, b) => 
      new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
    );
  }, [allMessages]);

  // Get latest message across all emails
  const latestMessage = getAllMessagesSorted()[0] || null;

  // Force refresh all emails
  const forceRefreshAll = useCallback(async () => {
    await Promise.all(emailHooks.map(hook => hook.forcePoll()));
  }, [emailHooks]);

  return {
    allMessages,
    totalUnread,
    latestMessage,
    getAllMessagesSorted,
    forceRefreshAll,
    emailHooks, // Individual hooks for granular control
  };
}