'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BehavioralData {
  // Time metrics
  timeOnPage: number;
  timeToFirstInteraction: number | null;
  idleTime: number;
  
  // Scroll metrics
  scrollDepth: number;
  maxScrollDepth: number;
  scrollVelocity: number;
  scrollDirection: 'up' | 'down' | 'none';
  
  // Interaction metrics
  clickCount: number;
  keystrokes: number;
  mouseMovements: number;
  focusEvents: number;
  
  // Engagement metrics
  isEngaged: boolean;
  engagementScore: number; // 0-100
  attentionLevel: 'low' | 'medium' | 'high';
  
  // Page events
  pageVisibilityChanges: number;
  inactiveTime: number;
  rageclicks: number; // Rapid clicks in same area
  
  // Device/context
  isMobile: boolean;
  windowResizes: number;
  networkSpeed: 'slow' | 'medium' | 'fast';
}

interface BehavioralTrigger {
  id: string;
  name: string;
  condition: (data: BehavioralData) => boolean;
  cooldown: number; // Minimum time between triggers (ms)
  maxTriggers: number; // Maximum times this can trigger
  priority: 'low' | 'medium' | 'high';
  action: (data: BehavioralData) => void;
}

interface TriggerHistory {
  triggerId: string;
  timestamp: number;
  data: BehavioralData;
}

export function useBehavioralTriggers(triggers: BehavioralTrigger[]) {
  const [behavioralData, setBehavioralData] = useState<BehavioralData>({
    timeOnPage: 0,
    timeToFirstInteraction: null,
    idleTime: 0,
    scrollDepth: 0,
    maxScrollDepth: 0,
    scrollVelocity: 0,
    scrollDirection: 'none',
    clickCount: 0,
    keystrokes: 0,
    mouseMovements: 0,
    focusEvents: 0,
    isEngaged: false,
    engagementScore: 0,
    attentionLevel: 'low',
    pageVisibilityChanges: 0,
    inactiveTime: 0,
    rageclicks: 0,
    isMobile: false,
    windowResizes: 0,
    networkSpeed: 'medium',
  });

  const [triggerHistory, setTriggerHistory] = useState<TriggerHistory[]>([]);
  
  const startTimeRef = useRef<number>(Date.now());
  const lastInteractionRef = useRef<number>(Date.now());
  const lastScrollRef = useRef<{ y: number; time: number }>({ y: 0, time: Date.now() });
  const clickHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const networkSpeedRef = useRef<'slow' | 'medium' | 'fast'>('medium');

  // Update time on page and idle time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeOnPage = now - startTimeRef.current;
      const idleTime = now - lastInteractionRef.current;
      
      setBehavioralData(prev => ({
        ...prev,
        timeOnPage,
        idleTime,
        isEngaged: idleTime < 30000, // Engaged if active within 30 seconds
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate engagement score
  useEffect(() => {
    const calculateEngagementScore = () => {
      const {
        timeOnPage,
        scrollDepth,
        clickCount,
        keystrokes,
        mouseMovements,
        focusEvents,
        idleTime,
      } = behavioralData;

      let score = 0;

      // Time on page (0-30 points)
      score += Math.min(timeOnPage / 60000 * 15, 30); // 15 points per minute, max 30

      // Scroll depth (0-20 points)
      score += (scrollDepth / 100) * 20;

      // Interactions (0-25 points)
      const interactionScore = Math.min((clickCount + keystrokes + focusEvents) * 2, 25);
      score += interactionScore;

      // Mouse movement (0-10 points)
      score += Math.min(mouseMovements / 100 * 10, 10);

      // Penalize idle time (subtract up to 15 points)
      const idlePenalty = Math.min(idleTime / 30000 * 15, 15);
      score -= idlePenalty;

      const finalScore = Math.max(0, Math.min(100, score));
      
      const attentionLevel = finalScore >= 70 ? 'high' : finalScore >= 40 ? 'medium' : 'low';

      setBehavioralData(prev => ({
        ...prev,
        engagementScore: finalScore,
        attentionLevel,
      }));
    };

    calculateEngagementScore();
  }, [behavioralData.timeOnPage, behavioralData.scrollDepth, behavioralData.clickCount, behavioralData.keystrokes, behavioralData.mouseMovements, behavioralData.focusEvents, behavioralData.idleTime]);

  // Detect mobile device
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setBehavioralData(prev => ({ ...prev, isMobile }));
  }, []);

  // Network speed detection
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateNetworkSpeed = () => {
        const effectiveType = connection.effectiveType;
        let speed: 'slow' | 'medium' | 'fast' = 'medium';
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          speed = 'slow';
        } else if (effectiveType === '4g') {
          speed = 'fast';
        }
        
        networkSpeedRef.current = speed;
        setBehavioralData(prev => ({ ...prev, networkSpeed: speed }));
      };

      updateNetworkSpeed();
      connection.addEventListener('change', updateNetworkSpeed);
      
      return () => connection.removeEventListener('change', updateNetworkSpeed);
    }
  }, []);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = documentHeight > 0 ? Math.round((scrollY / documentHeight) * 100) : 0;
      
      const now = Date.now();
      const timeDiff = now - lastScrollRef.current.time;
      const scrollDiff = Math.abs(scrollY - lastScrollRef.current.y);
      const velocity = timeDiff > 0 ? scrollDiff / timeDiff : 0;
      
      const direction = scrollY > lastScrollRef.current.y ? 'down' : 
                      scrollY < lastScrollRef.current.y ? 'up' : 'none';

      lastScrollRef.current = { y: scrollY, time: now };
      lastInteractionRef.current = now;

      setBehavioralData(prev => ({
        ...prev,
        scrollDepth,
        maxScrollDepth: Math.max(prev.maxScrollDepth, scrollDepth),
        scrollVelocity: velocity,
        scrollDirection: direction,
      }));
    };

    let ticking = false;
    const optimizedHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedHandler, { passive: true });
    return () => window.removeEventListener('scroll', optimizedHandler);
  }, []);

  // Click tracking and rage click detection
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      const { clientX, clientY } = e;
      
      // Update first interaction time
      setBehavioralData(prev => {
        const timeToFirstInteraction = prev.timeToFirstInteraction || (now - startTimeRef.current);
        return {
          ...prev,
          clickCount: prev.clickCount + 1,
          timeToFirstInteraction,
        };
      });

      // Rage click detection (3+ clicks in same area within 1 second)
      clickHistoryRef.current.push({ x: clientX, y: clientY, time: now });
      clickHistoryRef.current = clickHistoryRef.current.filter(click => now - click.time < 1000);

      const recentClicks = clickHistoryRef.current.filter(click => 
        Math.abs(click.x - clientX) < 50 && Math.abs(click.y - clientY) < 50
      );

      if (recentClicks.length >= 3) {
        setBehavioralData(prev => ({ ...prev, rageclicks: prev.rageclicks + 1 }));
      }

      lastInteractionRef.current = now;
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Keyboard tracking
  useEffect(() => {
    const handleKeyDown = () => {
      const now = Date.now();
      setBehavioralData(prev => {
        const timeToFirstInteraction = prev.timeToFirstInteraction || (now - startTimeRef.current);
        return {
          ...prev,
          keystrokes: prev.keystrokes + 1,
          timeToFirstInteraction,
        };
      });
      lastInteractionRef.current = now;
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse movement tracking
  useEffect(() => {
    let mouseMovementCount = 0;
    const handleMouseMove = () => {
      mouseMovementCount++;
      lastInteractionRef.current = Date.now();
    };

    const updateMouseMovements = () => {
      setBehavioralData(prev => ({ ...prev, mouseMovements: mouseMovementCount }));
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    const interval = setInterval(updateMouseMovements, 5000); // Update every 5 seconds

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  // Focus events
  useEffect(() => {
    const handleFocus = () => {
      setBehavioralData(prev => ({ ...prev, focusEvents: prev.focusEvents + 1 }));
      lastInteractionRef.current = Date.now();
    };

    const handleBlur = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Page visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      setBehavioralData(prev => ({
        ...prev,
        pageVisibilityChanges: prev.pageVisibilityChanges + 1,
      }));

      if (document.hidden) {
        // Track inactive time start
        lastInteractionRef.current = Date.now();
      } else {
        // User returned to page
        lastInteractionRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Window resize tracking
  useEffect(() => {
    const handleResize = () => {
      setBehavioralData(prev => ({ ...prev, windowResizes: prev.windowResizes + 1 }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger evaluation
  useEffect(() => {
    triggers.forEach(trigger => {
      // Check cooldown
      const lastTrigger = triggerHistory
        .filter(h => h.triggerId === trigger.id)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (lastTrigger && Date.now() - lastTrigger.timestamp < trigger.cooldown) {
        return;
      }

      // Check max triggers
      const triggerCount = triggerHistory.filter(h => h.triggerId === trigger.id).length;
      if (triggerCount >= trigger.maxTriggers) {
        return;
      }

      // Evaluate condition
      if (trigger.condition(behavioralData)) {
        // Execute trigger
        trigger.action(behavioralData);
        
        // Record in history
        setTriggerHistory(prev => [...prev, {
          triggerId: trigger.id,
          timestamp: Date.now(),
          data: { ...behavioralData },
        }]);
      }
    });
  }, [behavioralData, triggers, triggerHistory]);

  return {
    behavioralData,
    triggerHistory,
    resetData: useCallback(() => {
      startTimeRef.current = Date.now();
      lastInteractionRef.current = Date.now();
      setBehavioralData(prev => ({
        ...prev,
        timeOnPage: 0,
        timeToFirstInteraction: null,
        idleTime: 0,
        scrollDepth: 0,
        maxScrollDepth: 0,
        clickCount: 0,
        keystrokes: 0,
        mouseMovements: 0,
        focusEvents: 0,
        pageVisibilityChanges: 0,
        rageclicks: 0,
        windowResizes: 0,
      }));
      setTriggerHistory([]);
    }, []),
  };
}

// Predefined behavioral triggers for conversion optimization
export const BEHAVIORAL_TRIGGERS = {
  HIGH_ENGAGEMENT_PROMPT: {
    id: 'high_engagement_prompt',
    name: 'High Engagement Upgrade Prompt',
    condition: (data: BehavioralData) => 
      data.engagementScore > 70 && 
      data.timeOnPage > 60000 && 
      data.maxScrollDepth > 50,
    cooldown: 180000, // 3 minutes
    maxTriggers: 1,
    priority: 'high' as const,
    action: (data: BehavioralData) => {
      // Show targeted upgrade prompt
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'upgrade_success',
          title: '🚀 You\'re Highly Engaged!',
          message: 'Upgrade now and get 30% off for being an active user',
          duration: 8000,
          action: {
            label: 'Get Discount',
            onClick: () => window.location.href = '/pricing?discount=30'
          }
        });
      }
    },
  },

  SCROLL_DEPTH_TRIGGER: {
    id: 'scroll_depth_trigger',
    name: 'Deep Scroll Conversion',
    condition: (data: BehavioralData) => data.maxScrollDepth >= 80,
    cooldown: 300000, // 5 minutes
    maxTriggers: 1,
    priority: 'medium' as const,
    action: (data: BehavioralData) => {
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'new_email',
          title: 'Loving What You See?',
          message: 'Unlock unlimited access with our premium plans',
          duration: 6000,
          action: {
            label: 'View Plans',
            onClick: () => window.location.href = '/pricing'
          }
        });
      }
    },
  },

  RAGE_CLICK_HELP: {
    id: 'rage_click_help',
    name: 'Rage Click Help Trigger',
    condition: (data: BehavioralData) => data.rageclicks >= 2,
    cooldown: 120000, // 2 minutes
    maxTriggers: 2,
    priority: 'high' as const,
    action: (data: BehavioralData) => {
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'error',
          title: 'Need Help?',
          message: 'Having trouble? Our support team is here to help!',
          duration: 10000,
          action: {
            label: 'Get Help',
            onClick: () => {
              // Open help chat or contact form
              console.log('Opening help system');
            }
          }
        });
      }
    },
  },

  IDLE_USER_RETARGETING: {
    id: 'idle_user_retargeting',
    name: 'Idle User Re-engagement',
    condition: (data: BehavioralData) => 
      data.idleTime > 45000 && 
      data.timeOnPage > 120000 && 
      data.clickCount > 3,
    cooldown: 180000, // 3 minutes
    maxTriggers: 1,
    priority: 'medium' as const,
    action: (data: BehavioralData) => {
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'new_email',
          title: 'Still There?',
          message: 'Don\'t miss out on premium features - 15% off for the next 10 minutes!',
          duration: 8000,
          action: {
            label: 'Claim Offer',
            onClick: () => window.location.href = '/pricing?discount=15&urgent=true'
          }
        });
      }
    },
  },

  MOBILE_SCROLL_UP_EXIT: {
    id: 'mobile_scroll_up_exit',
    name: 'Mobile Exit Intent Alternative',
    condition: (data: BehavioralData) => 
      data.isMobile && 
      data.scrollDirection === 'up' && 
      data.scrollDepth < 10 && 
      data.timeOnPage > 30000,
    cooldown: 300000, // 5 minutes
    maxTriggers: 1,
    priority: 'high' as const,
    action: (data: BehavioralData) => {
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'new_email',
          title: 'Wait! Special Mobile Offer 📱',
          message: 'Get premium features at 40% off - mobile exclusive!',
          duration: 10000,
          action: {
            label: 'Mobile Deal',
            onClick: () => window.location.href = '/pricing?mobile=true&discount=40'
          }
        });
      }
    },
  },
} as const;

// Hook for using predefined conversion triggers
export function useConversionTriggers() {
  return useBehavioralTriggers(Object.values(BEHAVIORAL_TRIGGERS));
}