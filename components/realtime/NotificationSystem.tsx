'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Mail, Clock, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'new_email' | 'message_received' | 'email_expiring' | 'upgrade_success' | 'error';
  title: string;
  message: string;
  timestamp: number;
  autoRemove?: boolean;
  duration?: number; // in milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  maxNotifications?: number;
  defaultDuration?: number;
  playSound?: boolean;
  enableVisualAlerts?: boolean;
}

export function NotificationSystem({
  maxNotifications = 5,
  defaultDuration = 5000,
  playSound = true,
  enableVisualAlerts = true,
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasPermission(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          setHasPermission(permission === 'granted');
        });
      }
    }
  }, []);

  // Create audio element for notification sounds
  useEffect(() => {
    if (playSound) {
      // Create a simple notification sound using Web Audio API
      const createNotificationSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      };

      audioRef.current = { play: createNotificationSound } as any;
    }
  }, [playSound]);

  // Add notification function
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      autoRemove: notification.autoRemove !== false,
      duration: notification.duration || defaultDuration,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Play sound for important notifications
    if (playSound && (notification.type === 'new_email' || notification.type === 'message_received')) {
      try {
        audioRef.current?.play();
      } catch (err) {
        // Ignore audio errors
      }
    }

    // Show browser notification if permission granted
    if (hasPermission && (notification.type === 'new_email' || notification.type === 'message_received')) {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.type,
          requireInteraction: false,
        });

        // Auto-close browser notification
        setTimeout(() => {
          browserNotification.close();
        }, 4000);
      } catch (err) {
        // Ignore notification errors
      }
    }

    // Auto-remove notification
    if (newNotification.autoRemove) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    // Visual alert (page title flash)
    if (enableVisualAlerts && document.hidden) {
      flashPageTitle(notification.title);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Flash page title for attention
  const flashPageTitle = (message: string) => {
    const originalTitle = document.title;
    let flashCount = 0;
    const maxFlashes = 6;

    const flashInterval = setInterval(() => {
      document.title = flashCount % 2 === 0 ? `✉️ ${message}` : originalTitle;
      flashCount++;

      if (flashCount >= maxFlashes) {
        clearInterval(flashInterval);
        document.title = originalTitle;
      }
    }, 1000);

    // Stop flashing when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearInterval(flashInterval);
        document.title = originalTitle;
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_email':
      case 'message_received':
        return Mail;
      case 'email_expiring':
        return Clock;
      case 'upgrade_success':
        return CheckCircle;
      case 'error':
      default:
        return Mail;
    }
  };

  // Get notification styling
  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'new_email':
      case 'message_received':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'email_expiring':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'upgrade_success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <>
      {/* Notification Container */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const style = getNotificationStyle(notification.type);

            return (
              <div
                key={notification.id}
                className={`${style} border rounded-lg p-4 shadow-lg animate-slide-in-right backdrop-blur-sm`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold truncate">
                        {notification.title}
                      </h4>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-sm mt-1 text-gray-600">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                      
                      {notification.action && (
                        <button
                          onClick={notification.action.onClick}
                          className="text-xs font-medium hover:underline"
                        >
                          {notification.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Clear All Button */}
          {notifications.length > 1 && (
            <div className="flex justify-end">
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global notification function exposure */}
      <div ref={(el) => {
        if (el && !el.dataset.initialized) {
          el.dataset.initialized = 'true';
          // Expose addNotification globally for easy access
          (window as any).addNotification = addNotification;
        }
      }} style={{ display: 'none' }} />
    </>
  );
}

// Utility hook for using notifications
export function useNotifications() {
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    if ((window as any).addNotification) {
      (window as any).addNotification(notification);
    }
  };

  // Convenience methods for common notification types
  const notifyNewEmail = (emailAddress: string) => {
    addNotification({
      type: 'new_email',
      title: 'New Email Generated',
      message: `${emailAddress} is ready to receive messages`,
      autoRemove: true,
      duration: 4000,
    });
  };

  const notifyNewMessage = (emailAddress: string, sender: string, subject: string) => {
    addNotification({
      type: 'message_received',
      title: 'New Message Received',
      message: `From: ${sender} - ${subject}`,
      autoRemove: true,
      duration: 6000,
      action: {
        label: 'View',
        onClick: () => {
          // Navigate to email or open modal
          window.location.hash = `email-${emailAddress}`;
        }
      }
    });
  };

  const notifyEmailExpiring = (emailAddress: string, timeRemaining: string) => {
    addNotification({
      type: 'email_expiring',
      title: 'Email Expiring Soon',
      message: `${emailAddress} expires in ${timeRemaining}`,
      autoRemove: true,
      duration: 8000,
      action: {
        label: 'Extend',
        onClick: () => {
          // Navigate to upgrade page
          window.location.href = '/pricing';
        }
      }
    });
  };

  const notifyError = (title: string, message: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      autoRemove: true,
      duration: 8000,
    });
  };

  const notifySuccess = (title: string, message: string) => {
    addNotification({
      type: 'upgrade_success',
      title,
      message,
      autoRemove: true,
      duration: 5000,
    });
  };

  return {
    addNotification,
    notifyNewEmail,
    notifyNewMessage,
    notifyEmailExpiring,
    notifyError,
    notifySuccess,
  };
}