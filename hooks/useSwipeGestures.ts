'use client';

import { useRef, useEffect, useCallback } from 'react';

interface SwipeGestureConfig {
  threshold: number; // Minimum distance for swipe detection (px)
  restraint: number; // Maximum distance in perpendicular direction (px)
  allowedTime: number; // Maximum time for swipe (ms)
  enableTouch: boolean; // Enable touch events
  enableMouse: boolean; // Enable mouse events for testing
}

interface SwipeGestureData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTime: number;
  endTime: number;
  distance: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  velocity: number;
  element: HTMLElement | null;
}

interface SwipeGestureCallbacks {
  onSwipeLeft?: (data: SwipeGestureData) => void;
  onSwipeRight?: (data: SwipeGestureData) => void;
  onSwipeUp?: (data: SwipeGestureData) => void;
  onSwipeDown?: (data: SwipeGestureData) => void;
  onSwipeStart?: (data: Partial<SwipeGestureData>) => void;
  onSwipeEnd?: (data: SwipeGestureData) => void;
}

export function useSwipeGestures(
  elementRef: React.RefObject<HTMLElement>,
  callbacks: SwipeGestureCallbacks,
  config: Partial<SwipeGestureConfig> = {}
) {
  const defaultConfig: SwipeGestureConfig = {
    threshold: 50,
    restraint: 100,
    allowedTime: 300,
    enableTouch: true,
    enableMouse: false, // Disabled by default for production
    ...config,
  };

  const gestureDataRef = useRef<Partial<SwipeGestureData>>({});
  const isSwipingRef = useRef(false);

  const calculateSwipeData = useCallback((
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    startTime: number,
    endTime: number
  ): SwipeGestureData => {
    const distanceX = endX - startX;
    const distanceY = endY - startY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const duration = endTime - startTime;
    const velocity = duration > 0 ? distance / duration : 0;

    let direction: SwipeGestureData['direction'] = null;

    if (duration <= defaultConfig.allowedTime && distance >= defaultConfig.threshold) {
      if (Math.abs(distanceX) >= Math.abs(distanceY)) {
        // Horizontal swipe
        if (Math.abs(distanceY) <= defaultConfig.restraint) {
          direction = distanceX > 0 ? 'right' : 'left';
        }
      } else {
        // Vertical swipe
        if (Math.abs(distanceX) <= defaultConfig.restraint) {
          direction = distanceY > 0 ? 'down' : 'up';
        }
      }
    }

    return {
      startX,
      startY,
      endX,
      endY,
      startTime,
      endTime,
      distance,
      direction,
      velocity,
      element: elementRef.current,
    };
  }, [defaultConfig, elementRef]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    const startTime = Date.now();
    gestureDataRef.current = {
      startX: clientX,
      startY: clientY,
      startTime,
      element: elementRef.current,
    };
    isSwipingRef.current = true;

    if (callbacks.onSwipeStart) {
      callbacks.onSwipeStart(gestureDataRef.current);
    }
  }, [callbacks, elementRef]);

  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!isSwipingRef.current || !gestureDataRef.current.startX || !gestureDataRef.current.startY || !gestureDataRef.current.startTime) {
      return;
    }

    const endTime = Date.now();
    const swipeData = calculateSwipeData(
      gestureDataRef.current.startX,
      gestureDataRef.current.startY,
      clientX,
      clientY,
      gestureDataRef.current.startTime,
      endTime
    );

    isSwipingRef.current = false;

    // Call appropriate callback based on direction
    switch (swipeData.direction) {
      case 'left':
        callbacks.onSwipeLeft?.(swipeData);
        break;
      case 'right':
        callbacks.onSwipeRight?.(swipeData);
        break;
      case 'up':
        callbacks.onSwipeUp?.(swipeData);
        break;
      case 'down':
        callbacks.onSwipeDown?.(swipeData);
        break;
    }

    callbacks.onSwipeEnd?.(swipeData);
  }, [callbacks, calculateSwipeData]);

  // Touch event handlers
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !defaultConfig.enableTouch) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    };

    const handleTouchCancel = () => {
      isSwipingRef.current = false;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [elementRef, defaultConfig.enableTouch, handleStart, handleEnd]);

  // Mouse event handlers (for testing on desktop)
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !defaultConfig.enableMouse) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleEnd(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      isSwipingRef.current = false;
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef, defaultConfig.enableMouse, handleStart, handleEnd]);

  return {
    isGestureActive: isSwipingRef.current,
    currentGestureData: gestureDataRef.current,
  };
}

// Hook for swipeable list items (common pattern)
export function useSwipeableListItem(
  elementRef: React.RefObject<HTMLElement>,
  actions: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    leftAction?: { icon: React.ReactNode; color: string; label: string };
    rightAction?: { icon: React.ReactNode; color: string; label: string };
  }
) {
  const { onSwipeLeft, onSwipeRight, leftAction, rightAction } = actions;

  return useSwipeGestures(elementRef, {
    onSwipeLeft: (data) => {
      if (onSwipeLeft && data.velocity > 0.2) { // Minimum velocity threshold
        onSwipeLeft();
      }
    },
    onSwipeRight: (data) => {
      if (onSwipeRight && data.velocity > 0.2) {
        onSwipeRight();
      }
    },
  }, {
    threshold: 60, // Slightly higher threshold for list items
    restraint: 80,
    allowedTime: 400,
    enableTouch: true,
    enableMouse: false,
  });
}

// Hook for swipe-to-dismiss pattern
export function useSwipeToDismiss(
  elementRef: React.RefObject<HTMLElement>,
  onDismiss: (direction: 'left' | 'right') => void,
  options: {
    threshold?: number;
    enableBothDirections?: boolean;
  } = {}
) {
  const { threshold = 100, enableBothDirections = true } = options;

  return useSwipeGestures(elementRef, {
    onSwipeLeft: (data) => {
      if (data.distance >= threshold) {
        onDismiss('left');
      }
    },
    onSwipeRight: (data) => {
      if (enableBothDirections && data.distance >= threshold) {
        onDismiss('right');
      }
    },
  }, {
    threshold,
    restraint: 120,
    allowedTime: 500,
    enableTouch: true,
    enableMouse: false,
  });
}

// Hook for pull-to-refresh with haptic feedback
export function usePullToRefresh(
  elementRef: React.RefObject<HTMLElement>,
  onRefresh: () => Promise<void>,
  options: {
    threshold?: number;
    enableHaptic?: boolean;
    refreshIcon?: React.ReactNode;
  } = {}
) {
  const { threshold = 80, enableHaptic = true } = options;

  const triggerHapticFeedback = useCallback(() => {
    if (enableHaptic && 'vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration
    }
  }, [enableHaptic]);

  return useSwipeGestures(elementRef, {
    onSwipeDown: async (data) => {
      if (data.distance >= threshold && data.startY < 100) { // Only near top of screen
        triggerHapticFeedback();
        await onRefresh();
      }
    },
  }, {
    threshold,
    restraint: 100,
    allowedTime: 800, // Longer time for pull gesture
    enableTouch: true,
    enableMouse: false,
  });
}

// Email-specific swipe actions
export const EMAIL_SWIPE_ACTIONS = {
  DELETE: {
    icon: '🗑️',
    color: '#ef4444',
    label: 'Delete',
    action: 'delete' as const,
  },
  COPY: {
    icon: '📋',
    color: '#3b82f6',
    label: 'Copy',
    action: 'copy' as const,
  },
  ARCHIVE: {
    icon: '📁',
    color: '#6b7280',
    label: 'Archive',
    action: 'archive' as const,
  },
  SHARE: {
    icon: '🔗',
    color: '#10b981',
    label: 'Share',
    action: 'share' as const,
  },
  REFRESH: {
    icon: '🔄',
    color: '#8b5cf6',
    label: 'Refresh',
    action: 'refresh' as const,
  },
} as const;