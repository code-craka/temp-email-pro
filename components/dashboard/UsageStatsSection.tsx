'use client'

import { 
  Mail, 
  MessageSquare, 
  Globe, 
  TrendingUp, 
  Crown,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { User, DailyUsage } from '@/app/dashboard/page'

interface UsageStatsSectionProps {
  user: User
  usage: DailyUsage | null
  onUpgrade: () => void
}

const getTierLimits = (tier: string) => {
  switch (tier) {
    case 'free':
      return { dailyEmails: 5, retention: '1 hour', apiCalls: 0 }
    case 'quick':
      return { dailyEmails: 25, retention: '24 hours', apiCalls: 100 }
    case 'extended':
      return { dailyEmails: 100, retention: '1 week', apiCalls: 1000 }
    case 'pro':
      return { dailyEmails: 500, retention: '30 days', apiCalls: 10000 }
    default:
      return { dailyEmails: 5, retention: '1 hour', apiCalls: 0 }
  }
}

const getUsageColor = (current: number, limit: number) => {
  const percentage = (current / limit) * 100
  if (percentage >= 90) return 'text-red-600 bg-red-50 border-red-200'
  if (percentage >= 75) return 'text-orange-600 bg-orange-50 border-orange-200'
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-green-600 bg-green-50 border-green-200'
}

const getProgressColor = (current: number, limit: number) => {
  const percentage = (current / limit) * 100
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-orange-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

interface StatCardProps {
  title: string
  value: number
  limit: number | null
  icon: React.ReactNode
  suffix?: string
  showProgress?: boolean
  onUpgrade?: () => void
  upgradeMessage?: string
}

function StatCard({ 
  title, 
  value, 
  limit, 
  icon, 
  suffix = '', 
  showProgress = true,
  onUpgrade,
  upgradeMessage
}: StatCardProps) {
  const percentage = limit ? Math.min((value / limit) * 100, 100) : 0
  const isNearLimit = limit && percentage >= 80
  const isAtLimit = limit && value >= limit

  return (
    <div className={`bg-white rounded-lg border-2 p-6 transition-all hover:shadow-md ${
      isAtLimit ? 'border-red-200 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            isAtLimit ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
        
        {isNearLimit && onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full hover:bg-orange-200 transition-colors"
          >
            Upgrade
          </button>
        )}
      </div>

      {/* Value */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className={`text-3xl font-bold ${
            isAtLimit ? 'text-red-600' : 'text-gray-900'
          }`}>
            {value.toLocaleString()}
          </span>
          {suffix && (
            <span className="text-sm text-gray-500">{suffix}</span>
          )}
        </div>
        
        {limit && (
          <p className="text-sm text-gray-500 mt-1">
            of {limit.toLocaleString()} {limit === 1 ? 'allowed' : 'limit'}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && limit && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Usage</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(value, limit)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Message */}
      {isAtLimit && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Limit reached! {upgradeMessage}</span>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>Almost at limit. Consider upgrading soon.</span>
        </div>
      )}

      {!isNearLimit && limit && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>You're all set!</span>
        </div>
      )}
    </div>
  )
}

export function UsageStatsSection({ user, usage, onUpgrade }: UsageStatsSectionProps) {
  const limits = getTierLimits(user.subscription_tier)
  
  // Default usage if not loaded
  const currentUsage = usage || {
    id: '',
    user_id: user.id,
    date: new Date().toISOString().split('T')[0],
    emails_generated: 0,
    emails_received: 0,
    api_calls: 0,
    created_at: '',
    updated_at: ''
  }

  const stats = [
    {
      title: 'Emails Generated Today',
      value: currentUsage.emails_generated,
      limit: limits.dailyEmails,
      icon: <Mail className="h-5 w-5" />,
      upgradeMessage: 'Upgrade to generate more emails daily.'
    },
    {
      title: 'Messages Received',
      value: currentUsage.emails_received,
      limit: null,
      icon: <MessageSquare className="h-5 w-5" />,
      showProgress: false
    },
    {
      title: 'API Calls Today',
      value: currentUsage.api_calls,
      limit: user.subscription_tier === 'pro' ? limits.apiCalls : null,
      icon: <Globe className="h-5 w-5" />,
      upgradeMessage: 'Upgrade to Pro for API access.',
      showProgress: user.subscription_tier === 'pro'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Usage Statistics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your daily usage and see how much you have remaining
          </p>
        </div>
        
        {user.subscription_tier === 'free' && (
          <div className="hidden sm:block">
            <button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
            >
              <Crown className="h-4 w-4 mr-1 inline" />
              Upgrade Plan
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            limit={stat.limit}
            icon={stat.icon}
            showProgress={stat.showProgress}
            onUpgrade={onUpgrade}
            upgradeMessage={stat.upgradeMessage}
          />
        ))}
      </div>

      {/* Tier Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Plan
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Daily Emails:</span>
                <span className="ml-2 font-medium text-gray-900">{limits.dailyEmails}</span>
              </div>
              <div>
                <span className="text-gray-600">Retention:</span>
                <span className="ml-2 font-medium text-gray-900">{limits.retention}</span>
              </div>
              <div>
                <span className="text-gray-600">API Calls:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {limits.apiCalls > 0 ? limits.apiCalls.toLocaleString() : 'Not available'}
                </span>
              </div>
            </div>
          </div>
          
          {user.subscription_tier === 'free' && (
            <div className="text-center">
              <button
                onClick={onUpgrade}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
              <p className="text-xs text-gray-500 mt-2">Starting at $0.99/month</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Reset Timer */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          <Clock className="h-4 w-4 inline mr-1" />
          Daily usage resets at midnight UTC
        </p>
      </div>
    </div>
  )
}