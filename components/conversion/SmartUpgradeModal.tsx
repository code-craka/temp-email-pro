'use client'

import { useState, useEffect } from 'react'
import { 
  Crown, 
  X, 
  Zap, 
  Star, 
  CheckCircle, 
  Clock,
  Mail,
  Globe,
  Shield,
  Sparkles
} from 'lucide-react'
import { User, DailyUsage } from '@/app/dashboard/page'

interface SmartUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: string
  usage: DailyUsage | null
  user?: User
  trigger?: 'limit_hit' | 'time_expiring' | 'feature_request' | 'manual'
}

interface PricingPlan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  popular?: boolean
  recommended?: boolean
  icon: React.ReactNode
  color: string
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'quick',
    name: 'Quick',
    price: 0.99,
    period: 'month',
    description: 'Perfect for light usage and testing',
    features: [
      '25 emails per day',
      '24-hour retention',
      'Custom domains (techsci.dev, techsci.xyz)',
      'Priority support',
      'No ads'
    ],
    icon: <Zap className="h-5 w-5" />,
    color: 'blue'
  },
  {
    id: 'extended',
    name: 'Extended',
    price: 2.99,
    period: 'month',
    description: 'Most popular for regular users',
    features: [
      '100 emails per day',
      '1 week retention',
      'All Quick features',
      'Email forwarding',
      'Premium negoman.com domain',
      'API access (1,000 calls/month)'
    ],
    popular: true,
    recommended: true,
    icon: <Star className="h-5 w-5" />,
    color: 'purple'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    period: 'month',
    description: 'For power users and developers',
    features: [
      '500 emails per day',
      '30-day retention',
      'All Extended features',
      'Bulk email creation',
      'Exclusive techsci.tech domain',
      'Full API access (10,000 calls/month)',
      'White-label options',
      'Priority support'
    ],
    icon: <Crown className="h-5 w-5" />,
    color: 'yellow'
  }
]

function PlanCard({ plan, isRecommended, onSelect }: { 
  plan: PricingPlan
  isRecommended: boolean
  onSelect: () => void 
}) {
  const colorStyles = {
    blue: 'border-blue-500 bg-blue-50',
    purple: 'border-purple-500 bg-purple-50',
    yellow: 'border-yellow-500 bg-yellow-50'
  }

  const buttonStyles = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700'
  }

  return (
    <div className={`relative border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
      isRecommended ? colorStyles[plan.color as keyof typeof colorStyles] : 'border-gray-200 hover:border-gray-300'
    }`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      {plan.recommended && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Recommended
          </span>
        </div>
      )}

      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
          isRecommended ? 'bg-white' : 'bg-gray-100'
        }`}>
          {plan.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
          <span className="text-gray-600">/{plan.period}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
      </div>

      <ul className="space-y-2 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
          buttonStyles[plan.color as keyof typeof buttonStyles]
        }`}
      >
        Choose {plan.name}
      </button>
    </div>
  )
}

export function SmartUpgradeModal({ 
  isOpen, 
  onClose, 
  currentTier, 
  usage, 
  user,
  trigger = 'manual' 
}: SmartUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('extended')
  const [isProcessing, setIsProcessing] = useState(false)

  // Auto-select recommended plan based on usage
  useEffect(() => {
    if (usage) {
      if (usage.emails_generated >= 50 || usage.api_calls > 0) {
        setSelectedPlan('pro')
      } else if (usage.emails_generated >= 10 || usage.emails_received >= 5) {
        setSelectedPlan('extended')
      } else {
        setSelectedPlan('quick')
      }
    }
  }, [usage])

  if (!isOpen) return null

  const getModalContent = () => {
    switch (trigger) {
      case 'limit_hit':
        return {
          title: '🚀 Daily Limit Reached!',
          subtitle: 'You\'re actively using TempEmailPro! Upgrade to generate unlimited emails.',
          urgency: 'high'
        }
      case 'time_expiring':
        return {
          title: '⏰ Your Emails Expire Soon!',
          subtitle: 'Upgrade now to extend retention and never lose important messages.',
          urgency: 'high'
        }
      case 'feature_request':
        return {
          title: '🎯 Unlock Premium Features',
          subtitle: 'Access custom domains, extended retention, and professional tools.',
          urgency: 'medium'
        }
      default:
        return {
          title: '👑 Upgrade Your Experience',
          subtitle: 'Choose the perfect plan for your temporary email needs.',
          urgency: 'low'
        }
    }
  }

  const content = getModalContent()
  const selectedPlanData = pricingPlans.find(p => p.id === selectedPlan)

  const handleUpgrade = async () => {
    setIsProcessing(true)
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedPlan,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/dashboard?upgrade=cancelled`
        })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{content.title}</h2>
                  <p className="text-blue-100 text-sm">{content.subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Usage stats if available */}
            {usage && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Your Usage Today</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{usage.emails_generated}</div>
                    <div className="text-xs text-gray-500">Emails Generated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{usage.emails_received}</div>
                    <div className="text-xs text-gray-500">Messages Received</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{usage.api_calls}</div>
                    <div className="text-xs text-gray-500">API Calls</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {pricingPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isRecommended={plan.id === selectedPlan}
                  onSelect={() => setSelectedPlan(plan.id)}
                />
              ))}
            </div>

            {/* Benefits section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Why Upgrade?</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Professional custom domains</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Extended email retention</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Priority customer support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>No daily usage limits</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Upgrade to ${selectedPlanData?.name} - $${selectedPlanData?.price}/month`
                )}
              </button>
              
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
            </div>

            {/* Trust indicators */}
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                🔒 Secure payment with Stripe • 💳 Cancel anytime • 🔄 14-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}