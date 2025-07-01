'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface ExitIntentConfig {
  threshold: number; // How close to top edge triggers exit intent (in pixels)
  delay: number; // Minimum time on page before exit intent can trigger (in ms)
  sensitivity: number; // Mouse movement speed threshold
  maxTriggers: number; // Maximum times exit intent can trigger per session
  isMobileEnabled: boolean; // Enable exit intent on mobile devices
  mobileScrollThreshold: number; // Scroll up threshold for mobile exit intent
}

interface ExitIntentState {
  hasTriggered: boolean;
  triggerCount: number;
  timeOnPage: number;
  lastTriggerTime: number | null;
  isTriggerEnabled: boolean;
}

export function useExitIntent(
  onExitIntent: () => void,
  config: Partial<ExitIntentConfig> = {}
) {
  const defaultConfig: ExitIntentConfig = {
    threshold: 50,
    delay: 10000, // 10 seconds
    sensitivity: 3,
    maxTriggers: 2,
    isMobileEnabled: true,
    mobileScrollThreshold: 100,
    ...config,
  };

  const [state, setState] = useState<ExitIntentState>({
    hasTriggered: false,
    triggerCount: 0,
    timeOnPage: 0,
    lastTriggerTime: null,
    isTriggerEnabled: false,
  });

  const mountTimeRef = useRef<number>(Date.now());
  const lastMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastScrollPositionRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTriggering = useRef<boolean>(false);

  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Update time on page
  useEffect(() => {
    const interval = setInterval(() => {
      const timeOnPage = Date.now() - mountTimeRef.current;
      setState(prev => ({
        ...prev,
        timeOnPage,
        isTriggerEnabled: timeOnPage >= defaultConfig.delay && prev.triggerCount < defaultConfig.maxTriggers,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [defaultConfig.delay, defaultConfig.maxTriggers]);

  // Exit intent trigger function
  const triggerExitIntent = useCallback(() => {
    if (isTriggering.current || !state.isTriggerEnabled) return;

    isTriggering.current = true;
    
    setState(prev => ({
      ...prev,
      hasTriggered: true,
      triggerCount: prev.triggerCount + 1,
      lastTriggerTime: Date.now(),
    }));

    onExitIntent();

    // Prevent immediate re-triggering
    setTimeout(() => {
      isTriggering.current = false;
    }, 2000);
  }, [state.isTriggerEnabled, onExitIntent]);

  // Desktop exit intent detection (mouse movement)
  useEffect(() => {
    if (isMobile && !defaultConfig.isMobileEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { x: lastX, y: lastY } = lastMousePositionRef.current;
      
      // Calculate mouse speed
      const speed = Math.sqrt(
        Math.pow(clientX - lastX, 2) + Math.pow(clientY - lastY, 2)
      );

      lastMousePositionRef.current = { x: clientX, y: clientY };

      // Check if mouse is moving towards top of screen with sufficient speed
      if (
        clientY <= defaultConfig.threshold &&
        clientY < lastY &&
        speed >= defaultConfig.sensitivity &&
        state.isTriggerEnabled
      ) {
        triggerExitIntent();
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger if mouse leaves through the top of the viewport
      if (e.clientY <= 0 && state.isTriggerEnabled) {
        triggerExitIntent();
      }
    };

    if (!isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (!isMobile) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [defaultConfig.threshold, defaultConfig.sensitivity, state.isTriggerEnabled, triggerExitIntent, isMobile, defaultConfig.isMobileEnabled]);

  // Mobile exit intent detection (scroll behavior)
  useEffect(() => {
    if (!isMobile || !defaultConfig.isMobileEnabled) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollPositionRef.current;

      // Detect rapid upward scroll (user trying to leave)
      if (
        currentScrollY < lastScrollY &&
        lastScrollY - currentScrollY > defaultConfig.mobileScrollThreshold &&
        currentScrollY < 200 && // Near top of page
        state.isTriggerEnabled
      ) {
        triggerExitIntent();
      }

      lastScrollPositionRef.current = currentScrollY;
    };

    let ticking = false;
    const optimizedScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    if (isMobile) {
      window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    }

    return () => {
      if (isMobile) {
        window.removeEventListener('scroll', optimizedScrollHandler);
      }
    };
  }, [defaultConfig.mobileScrollThreshold, state.isTriggerEnabled, triggerExitIntent, isMobile, defaultConfig.isMobileEnabled]);

  // Page visibility change detection (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.isTriggerEnabled) {
        // Small delay to avoid false positives
        timeoutRef.current = setTimeout(() => {
          if (document.hidden) {
            triggerExitIntent();
          }
        }, 1000);
      } else if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.isTriggerEnabled, triggerExitIntent]);

  // Beforeunload event (browser close/navigation)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isTriggerEnabled && !state.hasTriggered) {
        // Note: Modern browsers ignore custom messages, but we can still trigger our handler
        triggerExitIntent();
        
        // Some browsers might show a generic confirmation dialog
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isTriggerEnabled, state.hasTriggered, triggerExitIntent]);

  // Manual trigger function (for testing or forced triggers)
  const manualTrigger = useCallback(() => {
    if (state.triggerCount < defaultConfig.maxTriggers) {
      triggerExitIntent();
    }
  }, [state.triggerCount, defaultConfig.maxTriggers, triggerExitIntent]);

  // Reset exit intent state
  const reset = useCallback(() => {
    setState({
      hasTriggered: false,
      triggerCount: 0,
      timeOnPage: Date.now() - mountTimeRef.current,
      lastTriggerTime: null,
      isTriggerEnabled: false,
    });
    mountTimeRef.current = Date.now();
  }, []);

  // Disable exit intent temporarily
  const disable = useCallback(() => {
    setState(prev => ({ ...prev, canTrigger: false }));
  }, []);

  // Enable exit intent
  const enable = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTriggerEnabled: prev.timeOnPage >= defaultConfig.delay && prev.triggerCount < defaultConfig.maxTriggers,
    }));
  }, [defaultConfig.delay, defaultConfig.maxTriggers]);

  return {
    // State
    hasTriggered: state.hasTriggered,
    triggerCount: state.triggerCount,
    timeOnPage: state.timeOnPage,
    isTriggerEnabled: state.isTriggerEnabled,
    lastTriggerTime: state.lastTriggerTime,
    isMobile,
    
    // Actions
    manualTrigger,
    reset,
    disable,
    enable,
  };
}

// Hook for tracking user behavior leading to exit intent
export function useExitIntentAnalytics() {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    timeSpent: 0,
    scrollDepth: 0,
    interactionCount: 0,
    lastInteraction: null as Date | null,
  });

  const updateScrollDepth = useCallback(() => {
    const scrollDepth = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    setAnalytics(prev => ({
      ...prev,
      scrollDepth: Math.max(prev.scrollDepth, scrollDepth),
    }));
  }, []);

  const trackInteraction = useCallback(() => {
    setAnalytics(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
      lastInteraction: new Date(),
    }));
  }, []);

  useEffect(() => {
    // Track scroll depth
    const handleScroll = () => updateScrollDepth();
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Track interactions
    const handleInteraction = () => trackInteraction();
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });

    // Track time spent
    const timeInterval = setInterval(() => {
      setAnalytics(prev => ({ ...prev, timeSpent: prev.timeSpent + 1 }));
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
      clearInterval(timeInterval);
    };
  }, [updateScrollDepth, trackInteraction]);

  return analytics;
}