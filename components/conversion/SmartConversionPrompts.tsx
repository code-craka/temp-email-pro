'use client';

import { useState, useEffect } from 'react';
import { Clock, Zap, Crown, Users, X } from 'lucide-react';
import type { User, UsageStats, TempEmail } from '@/types/dashboard';

interface SmartConversionPromptsProps {
  user: User;
  usage: UsageStats | null;
  emails: TempEmail[];
  onUpgrade: () => void;
}

interface ConversionPrompt {
  id: string;
  type: 'urgency' | 'limit' | 'feature' | 'social_proof';
  title: string;
  message: string;
  ctaText: string;
  ctaAction: () => void;
  icon: React.ComponentType<{ className?: string }>;
  priority: number;
  showCondition: () => boolean;
  variant: 'warning' | 'info' | 'success' | 'premium';
}

export function SmartConversionPrompts({ user, usage, emails, onUpgrade }: SmartConversionPromptsProps) {
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set());
  const [activePrompt, setActivePrompt] = useState<ConversionPrompt | null>(null);

  const prompts: ConversionPrompt[] = [
    {
      id: 'daily-limit-warning',
      type: 'limit',
      title: '⚠️ Approaching Daily Limit',
      message: `You've used ${usage?.today.emails_generated || 0} of ${usage?.limits.emails_per_day || 5} daily emails. Upgrade for unlimited access!`,
      ctaText: 'Upgrade Now',
      ctaAction: onUpgrade,
      icon: Clock,
      priority: 1,
      variant: 'warning',
      showCondition: () => {
        if (!usage) return false;
        const usagePercent = (usage.today.emails_generated / usage.limits.emails_per_day) * 100;
        return usagePercent >= 80 && user.subscription_tier === 'free';
      }
    },
    {
      id: 'premium-domain-feature',
      type: 'feature',
      title: '✨ Unlock Premium Domains',
      message: 'Get professional custom domains like @techsci.dev and @negoman.com with extended retention up to 30 days.',
      ctaText: 'View Plans',
      ctaAction: onUpgrade,
      icon: Crown,
      priority: 2,
      variant: 'premium',
      showCondition: () => {
        return user.subscription_tier === 'free' && emails.length >= 2;
      }
    },
    {
      id: 'retention-upgrade',
      type: 'urgency',
      title: '⏰ Emails Expire Soon',
      message: 'Free emails expire in 1 hour. Upgrade to keep emails for 24 hours to 30 days!',
      ctaText: 'Extend Retention',
      ctaAction: onUpgrade,
      icon: Clock,
      priority: 3,
      variant: 'warning',
      showCondition: () => {
        if (user.subscription_tier !== 'free' || emails.length === 0) return false;
        // Check if any email expires within 30 minutes
        const now = new Date().getTime();
        return emails.some(email => {
          const expires = new Date(email.expires_at).getTime();
          const timeLeft = expires - now;
          return timeLeft > 0 && timeLeft < 30 * 60 * 1000; // 30 minutes
        });
      }
    },
    {
      id: 'social-proof',
      type: 'social_proof',
      title: '🚀 Join 10,000+ Happy Users',
      message: '95% of users upgrade within 7 days. Start your free trial and see why they love TempMail Pro!',
      ctaText: 'Start Free Trial',
      ctaAction: onUpgrade,
      icon: Users,
      priority: 4,
      variant: 'info',
      showCondition: () => {
        return user.subscription_tier === 'free' && emails.length >= 3;
      }
    },
    {
      id: 'api-access-feature',
      type: 'feature',
      title: '🔧 Need API Access?',
      message: 'Automate your workflow with our powerful REST API. Perfect for developers and businesses.',
      ctaText: 'Get API Access',
      ctaAction: onUpgrade,
      icon: Zap,
      priority: 5,
      variant: 'info',
      showCondition: () => {
        return user.subscription_tier !== 'pro' && emails.length >= 5;
      }
    }
  ];

  useEffect(() => {
    // Find the highest priority prompt that should be shown and isn't dismissed
    const validPrompts = prompts
      .filter(prompt => prompt.showCondition() && !dismissedPrompts.has(prompt.id))
      .sort((a, b) => a.priority - b.priority);

    setActivePrompt(validPrompts[0] || null);
  }, [user, usage, emails, dismissedPrompts]);

  const handleDismiss = (promptId: string) => {
    setDismissedPrompts(prev => new Set([...prev, promptId]));
    setActivePrompt(null);
  };

  if (!activePrompt) {
    return null;
  }

  const variantStyles = {
    warning: 'bg-warning/10 border-warning/20 text-warning-foreground',
    info: 'bg-primary/10 border-primary/20 text-primary-foreground',
    success: 'bg-success/10 border-success/20 text-success-foreground',
    premium: 'gradient-glass border-primary/30 text-foreground'
  };

  const iconStyles = {
    warning: 'text-warning',
    info: 'text-primary',
    success: 'text-success',
    premium: 'text-primary'
  };

  return (
    <div className="mb-6">
      <div 
        className={`
          glass rounded-2xl p-6 border-2 animate-slide-up
          ${variantStyles[activePrompt.variant]}
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className={`p-2 rounded-lg bg-current/10 ${iconStyles[activePrompt.variant]}`}>
              <activePrompt.icon className={`w-5 h-5 ${iconStyles[activePrompt.variant]}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2">
                {activePrompt.title}
              </h3>
              <p className="text-sm opacity-90 mb-4">
                {activePrompt.message}
              </p>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={activePrompt.ctaAction}
                  className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all touch-target"
                >
                  {activePrompt.ctaText}
                </button>
                
                <button
                  onClick={() => handleDismiss(activePrompt.id)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => handleDismiss(activePrompt.id)}
            className="p-1 hover:bg-current/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress indicator for limit-based prompts */}
        {activePrompt.type === 'limit' && usage && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Daily Usage</span>
              <span>{usage.today.emails_generated} / {usage.limits.emails_per_day}</span>
            </div>
            <div className="w-full bg-current/20 rounded-full h-2">
              <div 
                className="bg-current h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((usage.today.emails_generated / usage.limits.emails_per_day) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Urgency countdown for time-based prompts */}
        {activePrompt.type === 'urgency' && emails.length > 0 && (
          <UrgencyCountdown emails={emails} />
        )}
      </div>
    </div>
  );
}

// Urgency countdown component
interface UrgencyCountdownProps {
  emails: TempEmail[];
}

function UrgencyCountdown({ emails }: UrgencyCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      if (emails.length === 0) return;
      
      const now = new Date().getTime();
      const nextExpiring = emails
        .map(email => ({
          ...email,
          timeLeft: new Date(email.expires_at).getTime() - now
        }))
        .filter(email => email.timeLeft > 0)
        .sort((a, b) => a.timeLeft - b.timeLeft)[0];

      if (nextExpiring) {
        const minutes = Math.floor(nextExpiring.timeLeft / (1000 * 60));
        const seconds = Math.floor((nextExpiring.timeLeft % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [emails]);

  if (!timeLeft) return null;

  return (
    <div className="mt-4 p-3 bg-current/10 rounded-lg">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Next email expires in:</span>
        </span>
        <span className="font-mono font-semibold">{timeLeft}</span>
      </div>
    </div>
  );
}