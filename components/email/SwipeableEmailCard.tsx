'use client';

import { useRef, useState, useCallback } from 'react';
import { Clock, Mail, Copy, Trash2, Archive, Share2, RotateCcw } from 'lucide-react';
import { useSwipeableListItem, EMAIL_SWIPE_ACTIONS } from '@/hooks/useSwipeGestures';
import type { TempEmail } from '@/types/dashboard';

interface SwipeableEmailCardProps {
  email: TempEmail;
  onCopy: (email: string) => void;
  onDelete?: (emailId: string) => void;
  onArchive?: (emailId: string) => void;
  onShare?: (email: string) => void;
  onRefresh?: (emailId: string) => void;
  index: number;
  className?: string;
}

interface SwipeActionConfig {
  icon: React.ReactNode;
  color: string;
  label: string;
  action: () => void;
}

export function SwipeableEmailCard({
  email,
  onCopy,
  onDelete,
  onArchive,
  onShare,
  onRefresh,
  index,
  className = '',
}: SwipeableEmailCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showActionFeedback, setShowActionFeedback] = useState<string | null>(null);

  // Calculate time remaining
  const updateTimer = useCallback(() => {
    const now = new Date().getTime();
    const expires = new Date(email.expires_at).getTime();
    const difference = expires - now;

    if (difference > 0) {
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeLeft('Expired');
    }
  }, [email.expires_at]);

  // Update timer on mount and every second
  React.useEffect(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [updateTimer]);

  // Show action feedback with haptic
  const showFeedback = useCallback((actionLabel: string) => {
    setShowActionFeedback(actionLabel);
    
    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => setShowActionFeedback(null), 1500);
  }, []);

  // Define swipe actions based on available handlers
  const leftAction: SwipeActionConfig | undefined = onDelete ? {
    icon: <Trash2 className="w-4 h-4" />,
    color: EMAIL_SWIPE_ACTIONS.DELETE.color,
    label: EMAIL_SWIPE_ACTIONS.DELETE.label,
    action: () => {
      onDelete(email.id);
      showFeedback('Deleted');
    },
  } : undefined;

  const rightAction: SwipeActionConfig | undefined = {
    icon: <Copy className="w-4 h-4" />,
    color: EMAIL_SWIPE_ACTIONS.COPY.color,
    label: EMAIL_SWIPE_ACTIONS.COPY.label,
    action: () => {
      onCopy(email.email_address);
      showFeedback('Copied');
    },
  };

  // Setup swipe gestures
  const { isGestureActive } = useSwipeableListItem(cardRef, {
    onSwipeLeft: leftAction?.action,
    onSwipeRight: rightAction?.action,
    leftAction: leftAction ? {
      icon: leftAction.icon,
      color: leftAction.color,
      label: leftAction.label,
    } : undefined,
    rightAction: rightAction ? {
      icon: rightAction.icon,
      color: rightAction.color,
      label: rightAction.label,
    } : undefined,
  });

  // Additional quick actions
  const quickActions = [
    onCopy && {
      icon: <Copy className="w-3 h-3" />,
      label: 'Copy',
      action: () => {
        onCopy(email.email_address);
        showFeedback('Copied');
      },
      color: 'text-blue-600',
    },
    onArchive && {
      icon: <Archive className="w-3 h-3" />,
      label: 'Archive',
      action: () => {
        onArchive(email.id);
        showFeedback('Archived');
      },
      color: 'text-gray-600',
    },
    onShare && {
      icon: <Share2 className="w-3 h-3" />,
      label: 'Share',
      action: () => {
        onShare(email.email_address);
        showFeedback('Shared');
      },
      color: 'text-green-600',
    },
    onRefresh && {
      icon: <RotateCcw className="w-3 h-3" />,
      label: 'Refresh',
      action: () => {
        onRefresh(email.id);
        showFeedback('Refreshed');
      },
      color: 'text-purple-600',
    },
  ].filter(Boolean) as SwipeActionConfig[];

  const isExpired = timeLeft === 'Expired';
  const isNearExpiry = !isExpired && timeLeft.includes('0h 0m') && parseInt(timeLeft.split('m')[0].split(' ')[1]) < 5;

  return (
    <div className="relative">
      {/* Action feedback overlay */}
      {showActionFeedback && (
        <div className="absolute inset-0 bg-green-500/20 rounded-xl flex items-center justify-center z-20 animate-fade-in">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
            {showActionFeedback}
          </div>
        </div>
      )}

      {/* Swipe hint for first card */}
      {index === 0 && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full animate-pulse">
            ← Swipe for actions →
          </div>
        </div>
      )}

      {/* Main card */}
      <div
        ref={cardRef}
        className={`
          relative glass rounded-xl p-4 transition-all duration-200 select-none
          ${isGestureActive ? 'scale-105 shadow-lg' : 'glass-hover'}
          ${isExpired ? 'opacity-60' : ''}
          ${isNearExpiry ? 'ring-2 ring-warning/50' : ''}
          animate-slide-up ${className}
        `}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Email header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate max-w-full">
                {email.email_address}
              </code>
              {email.custom_domain && (
                <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium flex-shrink-0">
                  Premium
                </div>
              )}
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <span className={`flex items-center space-x-1 ${
                isExpired ? 'text-destructive' : 
                isNearExpiry ? 'text-warning' : ''
              }`}>
                <Clock className="w-3 h-3" />
                <span className={isNearExpiry ? 'animate-pulse font-medium' : ''}>
                  {timeLeft}
                </span>
              </span>
              <span className="flex items-center space-x-1">
                <Mail className="w-3 h-3" />
                <span>{email.messages_count} messages</span>
              </span>
            </div>
          </div>
          
          {/* Visual activity indicator */}
          {email.messages_count > 0 && !isExpired && (
            <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow flex-shrink-0"></div>
          )}
        </div>

        {/* Quick actions - visible on larger screens */}
        <div className="hidden md:flex items-center justify-between pt-3 border-t border-glass-border">
          <div className="flex items-center space-x-1">
            {quickActions.slice(0, 3).map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className={`
                  p-2 rounded-lg transition-all touch-target glass-hover
                  ${action.color} hover:bg-current/10
                `}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
          
          {quickActions.length > 3 && (
            <div className="flex items-center space-x-1">
              {quickActions.slice(3).map((action, idx) => (
                <button
                  key={idx + 3}
                  onClick={action.action}
                  className={`
                    p-2 rounded-lg transition-all touch-target glass-hover
                    ${action.color} hover:bg-current/10
                  `}
                  title={action.label}
                >
                  {action.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile swipe indicators */}
        <div className="md:hidden pt-3 border-t border-glass-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {leftAction && (
              <div className="flex items-center space-x-1">
                <span>← Swipe left:</span>
                <span className="font-medium">{leftAction.label}</span>
              </div>
            )}
            {rightAction && (
              <div className="flex items-center space-x-1">
                <span>Swipe right →</span>
                <span className="font-medium">{rightAction.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expiry warning for near-expiry emails */}
        {isNearExpiry && (
          <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center space-x-2 text-warning text-sm">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="font-medium">Email expires soon!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for managing swipeable email list
export function useSwipeableEmailList(
  emails: TempEmail[],
  actions: {
    onCopy: (email: string) => void;
    onDelete?: (emailId: string) => void;
    onArchive?: (emailId: string) => void;
    onShare?: (email: string) => void;
    onRefresh?: (emailId: string) => void;
  }
) {
  const [optimisticEmails, setOptimisticEmails] = useState(emails);

  // Optimistic updates for better UX
  const handleOptimisticDelete = useCallback((emailId: string) => {
    setOptimisticEmails(prev => prev.filter(email => email.id !== emailId));
    actions.onDelete?.(emailId);
  }, [actions]);

  const handleOptimisticArchive = useCallback((emailId: string) => {
    setOptimisticEmails(prev => 
      prev.map(email => 
        email.id === emailId 
          ? { ...email, status: 'archived' as any }
          : email
      )
    );
    actions.onArchive?.(emailId);
  }, [actions]);

  // Sync with external emails prop
  React.useEffect(() => {
    setOptimisticEmails(emails);
  }, [emails]);

  return {
    emails: optimisticEmails,
    actions: {
      ...actions,
      onDelete: handleOptimisticDelete,
      onArchive: handleOptimisticArchive,
    },
  };
}