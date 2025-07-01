'use client';

import { useRef, useState, useCallback } from 'react';
import { RotateCcw, ChevronDown } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/useSwipeGestures';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  enableHaptic?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  enableHaptic = true,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [onRefresh, disabled, isRefreshing]);

  // Enhanced pull-to-refresh with visual feedback
  const { isGestureActive } = usePullToRefresh(containerRef, handleRefresh, {
    threshold,
    enableHaptic,
    refreshIcon: <RotateCcw className="w-5 h-5" />,
  });

  // Track pull gesture for visual feedback
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = e.touches[0];
    if (touch.clientY < 100 && containerRef.current?.scrollTop === 0) {
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    const touch = e.touches[0];
    const startY = 50; // Approximate touch start position
    const currentY = touch.clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
      
      // Prevent default scrolling when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;
    
    if (pullDistance >= threshold && !disabled && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [isPulling, pullDistance, threshold, disabled, isRefreshing, handleRefresh]);

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = refreshProgress >= 1;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div 
        className={`
          absolute top-0 left-0 right-0 flex items-center justify-center
          transition-all duration-300 ease-out z-10
          ${isPulling || isRefreshing ? 'pointer-events-none' : 'pointer-events-auto'}
        `}
        style={{
          height: `${Math.max(pullDistance * 0.6, isRefreshing ? 60 : 0)}px`,
          transform: `translateY(${isPulling ? 0 : isRefreshing ? 0 : '-100%'})`,
        }}
      >
        <div className={`
          flex flex-col items-center space-y-2 px-4 py-2
          ${isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-200
        `}>
          {/* Icon */}
          <div className={`
            w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center
            transition-all duration-300
            ${isRefreshing ? 'animate-spin' : shouldTrigger ? 'scale-110 bg-primary/20' : ''}
          `}>
            {isRefreshing ? (
              <RotateCcw className="w-4 h-4 text-primary" />
            ) : (
              <ChevronDown 
                className={`w-4 h-4 text-primary transition-transform duration-300 ${
                  shouldTrigger ? 'rotate-180' : ''
                }`} 
              />
            )}
          </div>
          
          {/* Text */}
          <div className="text-center">
            <div className={`text-sm font-medium transition-colors duration-300 ${
              shouldTrigger ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {isRefreshing 
                ? 'Refreshing...' 
                : shouldTrigger 
                  ? 'Release to refresh' 
                  : 'Pull to refresh'
              }
            </div>
            
            {/* Progress indicator */}
            {isPulling && !isRefreshing && (
              <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-100 ease-out"
                  style={{ width: `${refreshProgress * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        className={`transition-transform duration-300 ease-out ${
          isPulling || isRefreshing ? '' : ''
        }`}
        style={{
          transform: `translateY(${
            isPulling 
              ? Math.min(pullDistance * 0.6, threshold * 0.6) 
              : isRefreshing 
                ? 60 
                : 0
          }px)`,
        }}
      >
        {children}
      </div>

      {/* Loading overlay for disabled state */}
      {disabled && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
          <div className="glass rounded-xl p-4 flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing refresh states
export function useRefreshManager() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async (refreshFn: () => Promise<void>) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshFn();
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const canRefresh = useCallback(() => {
    if (isRefreshing) return false;
    if (!lastRefresh) return true;
    
    // Prevent refresh spam - minimum 2 seconds between refreshes
    const timeSinceLastRefresh = Date.now() - lastRefresh.getTime();
    return timeSinceLastRefresh > 2000;
  }, [isRefreshing, lastRefresh]);

  return {
    isRefreshing,
    lastRefresh,
    refresh,
    canRefresh,
  };
}

// Higher-order component for adding pull-to-refresh to any component
export function withPullToRefresh<T extends object>(
  Component: React.ComponentType<T>,
  refreshHandler: () => Promise<void>
) {
  return function PullToRefreshWrapper(props: T) {
    return (
      <PullToRefresh onRefresh={refreshHandler}>
        <Component {...props} />
      </PullToRefresh>
    );
  };
}