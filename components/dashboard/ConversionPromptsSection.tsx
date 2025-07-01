'use client'

import { useState, useEffect } from 'react'
import { 
  Crown, 
  Zap, 
  Clock, 
  TrendingUp, 
  Star, 
  Gift,
  AlertTriangle,
  CheckCircle,
  X,
  ArrowRight
} from 'lucide-react'
import { User, DailyUsage, TempEmail } from '@/app/dashboard/page'

interface ConversionPromptsSectionProps {
  user: User
  usage: DailyUsage | null
  emails: TempEmail[]
  onUpgrade: () => void
}

interface PromptCardProps {
  title: string
  description: string
  icon: React.ReactNode
  urgency: 'low' | 'medium' | 'high'
  ctaText: string
  onAction: () => void
  onDismiss?: () => void
  features?: string[]
  discount?: string
}

function PromptCard({ 
  title, 
  description, 
  icon, 
  urgency, 
  ctaText, 
  onAction, 
  onDismiss,
  features,
  discount
}: PromptCardProps) {
  const urgencyStyles = {
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-orange-200 bg-orange-50',
    high: 'border-red-200 bg-red-50'
  }

  const iconStyles = {
    low: 'bg-blue-100 text-blue-600',
    medium: 'bg-orange-100 text-orange-600',
    high: 'bg-red-100 text-red-600'
  }

  const buttonStyles = {
    low: 'bg-blue-600 hover:bg-blue-700 text-white',
    medium: 'bg-orange-600 hover:bg-orange-700 text-white',
    high: 'bg-red-600 hover:bg-red-700 text-white'
  }

  return (
    <div className={`border rounded-lg p-6 transition-all hover:shadow-md ${urgencyStyles[urgency]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${iconStyles[urgency]}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center">
              {title}
              {discount && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {discount}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Features */}
      {features && features.length > 0 && (
        <div className="mb-4">
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onAction}
        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${buttonStyles[urgency]}`}
      >
        {ctaText}
        <ArrowRight className="h-4 w-4 ml-2" />
      </button>
    </div>
  )
}

export function ConversionPromptsSection({ user, usage, emails, onUpgrade }: ConversionPromptsSectionProps) {
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set())
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute for time-based prompts
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const dismissPrompt = (promptId: string) => {
    setDismissedPrompts(prev => new Set([...prev, promptId]))
  }

  // Don't show conversion prompts for paid users
  if (user.subscription_tier !== 'free') {
    return null
  }

  const currentUsage = usage || {
    id: '',
    user_id: user.id,
    date: '',
    emails_generated: 0,
    emails_received: 0,
    api_calls: 0,
    created_at: '',
    updated_at: ''
  }

  const prompts = []

  // 1. Usage Limit Prompt (High Priority)
  if (currentUsage.emails_generated >= 4 && !dismissedPrompts.has('usage-limit')) {
    prompts.push(
      <PromptCard
        key="usage-limit"
        title="Almost at your daily limit!"
        description={`You've used ${currentUsage.emails_generated} of 5 free emails today. Upgrade to generate unlimited emails.`}
        icon={<AlertTriangle className="h-5 w-5" />}
        urgency="high"
        ctaText="Upgrade for $0.99/month"
        onAction={onUpgrade}
        onDismiss={() => dismissPrompt('usage-limit')}
        features={[
          '25 emails per day with Quick plan',
          'Custom domains included',
          '24-hour email retention',
          'No daily limits on messages'
        ]}
        discount="50% OFF"
      />
    )
  }

  // 2. Message Value Prompt (Medium Priority)
  if (currentUsage.emails_received >= 3 && !dismissedPrompts.has('message-value')) {
    prompts.push(
      <PromptCard
        key="message-value"
        title="You're getting valuable emails!"
        description={`You've received ${currentUsage.emails_received} messages today. Upgrade to keep them longer and access custom domains.`}
        icon={<Star className="h-5 w-5" />}
        urgency="medium"
        ctaText="Upgrade to Extended - $2.99/month"
        onAction={onUpgrade}
        onDismiss={() => dismissPrompt('message-value')}
        features={[
          '100 emails per day',
          'Email forwarding included',
          '1 week retention time',
          'Premium negoman.com domain'
        ]}
      />
    )
  }

  // 3. Time-Based Urgency Prompt
  const emailsWithShortTime = emails.filter(email => {
    const timeLeft = new Date(email.expires_at).getTime() - currentTime.getTime()
    const minutesLeft = timeLeft / (1000 * 60)
    return minutesLeft <= 10 && minutesLeft > 0
  })

  if (emailsWithShortTime.length > 0 && !dismissedPrompts.has('time-urgency')) {
    prompts.push(
      <PromptCard
        key="time-urgency"
        title="Your emails expire soon!"
        description={`${emailsWithShortTime.length} email${emailsWithShortTime.length > 1 ? 's' : ''} expire in less than 10 minutes. Upgrade for longer retention.`}
        icon={<Clock className="h-5 w-5" />}
        urgency="high"
        ctaText="Upgrade Now - Save Messages"
        onAction={onUpgrade}
        onDismiss={() => dismissPrompt('time-urgency')}
        features={[
          'Keep emails for 24 hours (Quick)',
          'Up to 1 week retention (Extended)', 
          'Never lose important messages',
          'Professional custom domains'
        ]}
      />
    )
  }

  // 4. Feature Discovery Prompt (Low Priority)
  if (currentUsage.emails_generated >= 2 && !dismissedPrompts.has('feature-discovery')) {
    prompts.push(
      <PromptCard
        key="feature-discovery"
        title="Unlock premium features!"
        description="You're using TempEmailPro actively! Discover what you're missing with custom domains and extended retention."
        icon={<Crown className="h-5 w-5" />}
        urgency="low"
        ctaText="See Premium Features"
        onAction={onUpgrade}
        onDismiss={() => dismissPrompt('feature-discovery')}
        features={[
          'Professional custom domains',
          'Email forwarding capabilities',
          'Extended message retention',
          'Priority customer support',
          'API access for developers'
        ]}
      />
    )
  }

  // 5. Social Proof Prompt (Low Priority)
  if (!dismissedPrompts.has('social-proof')) {
    prompts.push(
      <PromptCard
        key="social-proof"
        title="Join thousands of premium users!"
        description="Over 10,000 users have upgraded to unlock the full potential of temporary emails with custom domains and extended features."
        icon={<TrendingUp className="h-5 w-5" />}
        urgency="low"
        ctaText="Start Free Trial - No Credit Card"
        onAction={onUpgrade}
        onDismiss={() => dismissPrompt('social-proof')}
        features={[
          '14-day free trial included',
          'Cancel anytime, no commitment',
          'Join the premium community',
          'Full feature access during trial'
        ]}
      />
    )
  }

  // 6. Limited Time Offer (Medium Priority)
  const isWeekend = [0, 6].includes(currentTime.getDay())
  if (isWeekend && !dismissedPrompts.has('weekend-offer')) {
    prompts.push(
      <PromptCard
        key="weekend-offer"
        title="Weekend Special Offer!"
        description="Limited time: Get 3 months of Extended plan for the price of 2. Perfect for weekend projects and testing."
        icon={<Gift className="h-5 w-5" />}
        urgency="medium"
        ctaText="Claim Weekend Deal"
        onAction={onUpgrade}
        onDismiss={() => dismissPrompt('weekend-offer')}
        features={[
          '33% discount this weekend only',
          '100 emails per day',
          'Premium domains included',
          'Email forwarding enabled'
        ]}
        discount="33% OFF"
      />
    )
  }

  // Show maximum 2 prompts to avoid overwhelming the user
  const displayPrompts = prompts.slice(0, 2)

  if (displayPrompts.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Unlock More Features
        </h2>
        <div className="text-sm text-gray-500">
          Limited time offers
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayPrompts}
      </div>
    </div>
  )
}