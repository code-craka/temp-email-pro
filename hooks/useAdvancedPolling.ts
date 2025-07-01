'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface PollingConfig {
  baseInterval: number; // Base polling interval in ms
  maxInterval: number; // Maximum interval before capping
  maxRetries: number; // Maximum consecutive failures before giving up
  backoffMultiplier: number; // Multiplier for exponential backoff
  isOnlinePollingEnabled: boolean; // Only poll when online
}

interface PollingState {
  isPolling: boolean;
  isOnline: boolean;
  consecutiveErrors: number;
  currentInterval: number;
  lastSuccessTime: number | null;
  lastErrorTime: number | null;
}

export function useAdvancedPolling<T>(
  pollingFunction: () => Promise<T>,
  config: Partial<PollingConfig> = {}
) {
  const defaultConfig: PollingConfig = {
    baseInterval: 10000, // 10 seconds
    maxInterval: 300000, // 5 minutes
    maxRetries: 5,
    backoffMultiplier: 2,
    isOnlinePollingEnabled: true,
    ...config,
  };

  const [state, setState] = useState<PollingState>({
    isPolling: false,
    isOnline: navigator.onLine,
    consecutiveErrors: 0,
    currentInterval: defaultConfig.baseInterval,
    lastSuccessTime: null,
    lastErrorTime: null,
  });

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Calculate next interval with exponential backoff
  const calculateNextInterval = useCallback((errorCount: number) => {
    if (errorCount === 0) return defaultConfig.baseInterval;
    
    const exponentialDelay = defaultConfig.baseInterval * 
      Math.pow(defaultConfig.backoffMultiplier, errorCount - 1);
    
    return Math.min(exponentialDelay, defaultConfig.maxInterval);
  }, [defaultConfig]);

  // Execute polling function with error handling
  const executePolling = useCallback(async () => {
    if (!isActiveRef.current) return;

    // Skip if offline and online polling is enabled
    if (defaultConfig.isOnlinePollingEnabled && !state.isOnline) {
      return;
    }

    // Skip if too many consecutive errors
    if (state.consecutiveErrors >= defaultConfig.maxRetries) {
      // Maximum retries exceeded - polling will be stopped
      return;
    }

    setLoading(true);

    try {
      const result = await pollingFunction();
      
      if (!isActiveRef.current) return;

      setData(result);
      setError(null);
      
      setState(prev => ({
        ...prev,
        consecutiveErrors: 0,
        currentInterval: defaultConfig.baseInterval,
        lastSuccessTime: Date.now(),
      }));

    } catch (err) {
      if (!isActiveRef.current) return;

      const error = err instanceof Error ? err : new Error('Polling failed');
      setError(error);

      setState(prev => {
        const newErrorCount = prev.consecutiveErrors + 1;
        const newInterval = calculateNextInterval(newErrorCount);
        
        return {
          ...prev,
          consecutiveErrors: newErrorCount,
          currentInterval: newInterval,
          lastErrorTime: Date.now(),
        };
      });

      // Track polling errors for debugging (error count: ${state.consecutiveErrors + 1}/${defaultConfig.maxRetries})
    } finally {
      setLoading(false);
    }
  }, [pollingFunction, defaultConfig, state.isOnline, state.consecutiveErrors, calculateNextInterval]);

  // Schedule next poll
  const scheduleNextPoll = useCallback(() => {
    if (!isActiveRef.current || !state.isPolling) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      executePolling().then(() => {
        if (isActiveRef.current && state.isPolling) {
          scheduleNextPoll();
        }
      });
    }, state.currentInterval);
  }, [executePolling, state.isPolling, state.currentInterval]);

  // Start polling
  const startPolling = useCallback(() => {
    setState(prev => ({ ...prev, isPolling: true }));
    executePolling().then(() => {
      if (isActiveRef.current) {
        scheduleNextPoll();
      }
    });
  }, [executePolling, scheduleNextPoll]);

  // Stop polling
  const stopPolling = useCallback(() => {
    setState(prev => ({ ...prev, isPolling: false }));
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Force immediate poll (useful for manual refresh)
  const forcePoll = useCallback(async () => {
    await executePolling();
    if (state.isPolling) {
      scheduleNextPoll();
    }
  }, [executePolling, scheduleNextPoll, state.isPolling]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      if (state.isPolling) {
        // Immediately poll when coming back online
        forcePoll();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forcePoll, state.isPolling]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause polling to save resources
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else if (state.isPolling) {
        // Page is visible, resume polling
        forcePoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [forcePoll, state.isPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    error,
    loading,
    isPolling: state.isPolling,
    isOnline: state.isOnline,
    consecutiveErrors: state.consecutiveErrors,
    currentInterval: state.currentInterval,
    lastSuccessTime: state.lastSuccessTime,
    lastErrorTime: state.lastErrorTime,
    startPolling,
    stopPolling,
    forcePoll,
  };
}

// Convenience hook for common polling patterns
export function useRealtimeEmails(userId: string) {
  return useAdvancedPolling(
    async () => {
      const response = await fetch(`/api/emails?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.statusText}`);
      }
      return response.json();
    },
    {
      baseInterval: 10000, // 10 seconds
      maxInterval: 120000, // 2 minutes max
      maxRetries: 3,
      isOnlinePollingEnabled: true,
    }
  );
}

export function useRealtimeMessages(emailId: string) {
  return useAdvancedPolling(
    async () => {
      if (!emailId) return { messages: [] };
      
      const response = await fetch(`/api/emails/${emailId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      return response.json();
    },
    {
      baseInterval: 5000, // 5 seconds for messages
      maxInterval: 60000, // 1 minute max
      maxRetries: 5,
      isOnlinePollingEnabled: true,
    }
  );
}

export function useRealtimeMetrics() {
  return useAdvancedPolling(
    async () => {
      const response = await fetch('/api/metrics/realtime');
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }
      return response.json();
    },
    {
      baseInterval: 30000, // 30 seconds for metrics
      maxInterval: 300000, // 5 minutes max
      maxRetries: 3,
      isOnlinePollingEnabled: false, // Metrics can work offline with cached data
    }
  );
}