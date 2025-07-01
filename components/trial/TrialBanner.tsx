'use client'

import { useState } from 'react'
import { Crown, X, Clock } from 'lucide-react'

interface TrialBannerProps {
  daysRemaining: number
  onUpgrade: () => void
}

export function TrialBanner({ daysRemaining, onUpgrade }: TrialBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const getUrgencyColor = (days: number) => {
    if (days <= 1) return 'bg-red-600'
    if (days <= 3) return 'bg-orange-600'
    if (days <= 7) return 'bg-yellow-600'
    return 'bg-blue-600'
  }

  const getUrgencyMessage = (days: number) => {
    if (days === 0) return 'Your trial expires today!'
    if (days === 1) return 'Last day of your free trial!'
    if (days <= 3) return `Only ${days} days left in your trial!`
    return `${days} days remaining in your trial`
  }

  return (
    <div className={`${getUrgencyColor(daysRemaining)} text-white`}>
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5" />
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">
                {getUrgencyMessage(daysRemaining)}
              </p>
              <p className="text-sm opacity-90">
                Upgrade now to keep all premium features and avoid losing your custom domains.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <button
              onClick={onUpgrade}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Upgrade Now - Save 20%
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Dismiss trial banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
