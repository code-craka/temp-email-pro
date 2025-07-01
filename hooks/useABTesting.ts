'use client';

import { useState, useEffect, useCallback } from 'react';

interface ABTest {
  id: string;
  name: string;
  variants: ABVariant[];
  trafficAllocation: number; // Percentage of users to include in test (0-1)
  isActive: boolean;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface ABVariant {
  id: string;
  name: string;
  weight: number; // Relative weight for traffic distribution
  config: Record<string, any>; // Configuration for this variant
  description?: string;
}

interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  event: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ABTestAssignment {
  testId: string;
  variantId: string;
  assignedAt: number;
  sticky: boolean; // Whether user should always see the same variant
}

class ABTestingService {
  private assignments: Map<string, ABTestAssignment> = new Map();
  private results: ABTestResult[] = [];
  
  constructor() {
    this.loadAssignments();
  }

  private loadAssignments() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('ab_test_assignments');
      if (stored) {
        const assignments = JSON.parse(stored);
        this.assignments = new Map(Object.entries(assignments));
      }
    } catch (err) {
      console.warn('Failed to load A/B test assignments:', err);
    }
  }

  private saveAssignments() {
    if (typeof window === 'undefined') return;
    
    try {
      const assignmentsObj = Object.fromEntries(this.assignments);
      localStorage.setItem('ab_test_assignments', JSON.stringify(assignmentsObj));
    } catch (err) {
      console.warn('Failed to save A/B test assignments:', err);
    }
  }

  private getUserId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let userId = localStorage.getItem('ab_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ab_user_id', userId);
    }
    return userId;
  }

  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private isUserInTest(testId: string, trafficAllocation: number): boolean {
    const userId = this.getUserId();
    const hashValue = this.hash(userId + testId);
    const bucket = (hashValue % 100) / 100; // Convert to 0-1 range
    return bucket < trafficAllocation;
  }

  private selectVariant(test: ABTest): ABVariant {
    const userId = this.getUserId();
    const totalWeight = test.variants.reduce((sum, variant) => sum + variant.weight, 0);
    
    // Use hash to determine variant selection consistently
    const hashValue = this.hash(userId + test.id + 'variant');
    const bucket = hashValue % totalWeight;
    
    let currentWeight = 0;
    for (const variant of test.variants) {
      currentWeight += variant.weight;
      if (bucket < currentWeight) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return test.variants[0];
  }

  getVariant(test: ABTest): ABVariant | null {
    if (!test.isActive) {
      return test.variants[0] || null; // Return control variant if test is inactive
    }

    // Check if user should be included in test
    if (!this.isUserInTest(test.id, test.trafficAllocation)) {
      return test.variants[0] || null; // Return control variant
    }

    // Check for existing assignment
    const existingAssignment = this.assignments.get(test.id);
    if (existingAssignment && existingAssignment.sticky) {
      const variant = test.variants.find(v => v.id === existingAssignment.variantId);
      if (variant) {
        return variant;
      }
    }

    // Select new variant
    const selectedVariant = this.selectVariant(test);
    
    // Save assignment
    this.assignments.set(test.id, {
      testId: test.id,
      variantId: selectedVariant.id,
      assignedAt: Date.now(),
      sticky: true,
    });
    
    this.saveAssignments();
    
    return selectedVariant;
  }

  trackEvent(testId: string, event: string, metadata?: Record<string, any>) {
    const assignment = this.assignments.get(testId);
    if (!assignment) return;

    const result: ABTestResult = {
      testId,
      variantId: assignment.variantId,
      userId: this.getUserId(),
      event,
      timestamp: Date.now(),
      metadata,
    };

    this.results.push(result);
    
    // Send to analytics service (in a real app)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        event_category: 'ab_test',
        event_label: `${testId}:${assignment.variantId}`,
        custom_map: metadata,
      });
    }
  }

  getResults(): ABTestResult[] {
    return [...this.results];
  }

  clearAssignment(testId: string) {
    this.assignments.delete(testId);
    this.saveAssignments();
  }

  clearAllAssignments() {
    this.assignments.clear();
    this.saveAssignments();
  }
}

// Global instance
const abTestingService = new ABTestingService();

// Hook for using A/B tests
export function useABTest(test: ABTest) {
  const [variant, setVariant] = useState<ABVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const selectedVariant = abTestingService.getVariant(test);
    setVariant(selectedVariant);
    setIsLoading(false);

    // Track impression
    if (selectedVariant) {
      abTestingService.trackEvent(test.id, 'impression');
    }
  }, [test]);

  const trackEvent = useCallback((event: string, metadata?: Record<string, any>) => {
    abTestingService.trackEvent(test.id, event, metadata);
  }, [test.id]);

  return {
    variant,
    isLoading,
    trackEvent,
    config: variant?.config || {},
  };
}

// Hook for multiple A/B tests
export function useMultipleABTests(tests: ABTest[]) {
  const [variants, setVariants] = useState<Record<string, ABVariant | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const selectedVariants: Record<string, ABVariant | null> = {};
    
    tests.forEach(test => {
      selectedVariants[test.id] = abTestingService.getVariant(test);
      
      // Track impression for each test
      if (selectedVariants[test.id]) {
        abTestingService.trackEvent(test.id, 'impression');
      }
    });

    setVariants(selectedVariants);
    setIsLoading(false);
  }, [tests]);

  const trackEvent = useCallback((testId: string, event: string, metadata?: Record<string, any>) => {
    abTestingService.trackEvent(testId, event, metadata);
  }, []);

  return {
    variants,
    isLoading,
    trackEvent,
    getConfig: (testId: string) => variants[testId]?.config || {},
  };
}

// Predefined tests for TempEmailPro
export const CONVERSION_TESTS = {
  // Exit intent modal variations
  EXIT_INTENT_MODAL: {
    id: 'exit_intent_modal_v1',
    name: 'Exit Intent Modal Variations',
    variants: [
      {
        id: 'control',
        name: 'Control (Original)',
        weight: 50,
        config: {
          title: "Wait! Don't Leave Empty-Handed 🎁",
          subtitle: 'Get exclusive access to premium domains and unlimited emails',
          discountPercent: 20,
          urgencyTimer: true,
          socialProof: true,
        },
      },
      {
        id: 'urgency_focused',
        name: 'Urgency Focused',
        weight: 50,
        config: {
          title: '🚨 Limited Time: 50% OFF Premium!',
          subtitle: 'This exclusive offer expires in minutes - Don\'t miss out!',
          discountPercent: 50,
          urgencyTimer: true,
          socialProof: false,
          backgroundColor: '#ff4444',
        },
      },
    ],
    trafficAllocation: 0.8, // 80% of users
    isActive: true,
    startDate: '2025-01-01',
    description: 'Test different exit intent modal approaches',
  },

  // Button text variations
  UPGRADE_BUTTON_TEXT: {
    id: 'upgrade_button_text_v1',
    name: 'Upgrade Button Text',
    variants: [
      {
        id: 'control',
        name: 'Control',
        weight: 33,
        config: { buttonText: 'Upgrade Now' },
      },
      {
        id: 'benefit_focused',
        name: 'Benefit Focused',
        weight: 33,
        config: { buttonText: 'Get Unlimited Emails' },
      },
      {
        id: 'urgency_focused',
        name: 'Urgency Focused',
        weight: 34,
        config: { buttonText: 'Claim Limited Offer' },
      },
    ],
    trafficAllocation: 1.0, // 100% of users
    isActive: true,
    startDate: '2025-01-01',
    description: 'Test different upgrade button text options',
  },

  // Pricing display variations
  PRICING_DISPLAY: {
    id: 'pricing_display_v1',
    name: 'Pricing Display Format',
    variants: [
      {
        id: 'control',
        name: 'Monthly Pricing',
        weight: 50,
        config: {
          displayFormat: 'monthly',
          showAnnualSavings: false,
          emphasizeValue: false,
        },
      },
      {
        id: 'annual_savings',
        name: 'Annual Savings Emphasized',
        weight: 50,
        config: {
          displayFormat: 'annual',
          showAnnualSavings: true,
          emphasizeValue: true,
          savingsText: 'Save 40% with annual billing!',
        },
      },
    ],
    trafficAllocation: 0.5, // 50% of users
    isActive: true,
    startDate: '2025-01-01',
    description: 'Test monthly vs annual pricing display',
  },
} as const;

// Hook for conversion-specific tests
export function useConversionABTests() {
  return useMultipleABTests([
    CONVERSION_TESTS.EXIT_INTENT_MODAL,
    CONVERSION_TESTS.UPGRADE_BUTTON_TEXT,
    CONVERSION_TESTS.PRICING_DISPLAY,
  ]);
}

// Analytics helper
export function getABTestResults() {
  return abTestingService.getResults();
}

export function clearABTestData() {
  abTestingService.clearAllAssignments();
}