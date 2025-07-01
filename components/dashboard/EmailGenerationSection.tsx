'use client'

import { useState } from 'react'
import { 
  Mail, 
  RefreshCw, 
  Crown, 
  Zap,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { User } from '@/app/dashboard/page'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface EmailGenerationSectionProps {
  user: User
  onEmailGenerated: () => void
  onUpgrade: () => void
}

interface DomainOption {
  domain: string
  name: string
  tier: string
  icon: string
  popular?: boolean
  premium?: boolean
  description: string
}

const domainOptions: DomainOption[] = [
  { 
    domain: 'random', 
    name: 'Random Domain', 
    tier: 'free', 
    icon: '🎲',
    description: 'Get a random temporary email domain'
  },
  { 
    domain: 'techsci.dev', 
    name: 'TechSci Dev', 
    tier: 'quick', 
    icon: '🔧',
    description: 'Perfect for developers and tech professionals'
  },
  { 
    domain: 'techsci.xyz', 
    name: 'TechSci XYZ', 
    tier: 'quick', 
    icon: '🚀',
    description: 'Modern and professional domain'
  },
  { 
    domain: 'negoman.com', 
    name: 'Negoman', 
    tier: 'extended', 
    icon: '💼', 
    popular: true,
    description: 'Most popular premium domain'
  },
  { 
    domain: 'techsci.tech', 
    name: 'TechSci Tech', 
    tier: 'pro', 
    icon: '👑', 
    premium: true,
    description: 'Exclusive premium domain for Pro users'
  },
]

const canAccessDomain = (userTier: string, domainTier: string): boolean => {
  const tierHierarchy: Record<string, number> = { free: 0, quick: 1, extended: 2, pro: 3 }
  return tierHierarchy[userTier] >= tierHierarchy[domainTier]
}

interface DomainCardProps {
  option: DomainOption
  isSelected: boolean
  canAccess: boolean
  onSelect: () => void
  onUpgrade: () => void
}

function DomainCard({ option, isSelected, canAccess, onSelect, onUpgrade }: DomainCardProps) {
  return (
    <div className="relative">
      <button
        onClick={canAccess ? onSelect : onUpgrade}
        disabled={false}
        className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
          isSelected
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : canAccess
            ? 'border-gray-200 hover:border-gray-300 bg-white'
            : 'border-gray-100 bg-gray-50'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{option.icon}</span>
            <span className={`font-medium ${canAccess ? 'text-gray-900' : 'text-gray-400'}`}>
              {option.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {option.popular && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                Popular
              </span>
            )}
            {option.premium && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                Premium
              </span>
            )}
          </div>
        </div>

        {/* Domain display */}
        {option.domain !== 'random' && (
          <div className="mb-2">
            <code className={`text-sm px-2 py-1 rounded ${
              canAccess ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
            }`}>
              example@{option.domain}
            </code>
          </div>
        )}

        {/* Description */}
        <p className={`text-sm ${canAccess ? 'text-gray-600' : 'text-gray-400'}`}>
          {option.description}
        </p>

        {/* Tier requirement overlay */}
        {!canAccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
            <div className="text-center">
              <Crown className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-600">
                Requires {option.tier.charAt(0).toUpperCase() + option.tier.slice(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Click to upgrade
              </div>
            </div>
          </div>
        )}
      </button>
    </div>
  )
}

export function EmailGenerationSection({ user, onEmailGenerated, onUpgrade }: EmailGenerationSectionProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('random')
  const [customUsername, setCustomUsername] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateEmail = async () => {
    setGenerating(true)
    setError('')
    setLastGenerated(null)

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customDomain: selectedDomain !== 'random' ? selectedDomain : null,
          username: customUsername.trim() || null
        })
      })

      const data = await response.json()

      if (response.status === 402) {
        // Premium feature required
        setError(data.message || 'This feature requires a premium subscription')
        onUpgrade()
        return
      }

      if (response.status === 429) {
        setError('Daily limit reached. Upgrade to generate more emails.')
        return
      }

      if (!response.ok) {
        setError(data.message || 'Failed to generate email')
        return
      }

      setLastGenerated(data.data.email)
      setCustomUsername('') // Clear custom username after success
      onEmailGenerated() // Refresh the dashboard

    } catch (err) {
      setError('Network error occurred. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const selectedOption = domainOptions.find(opt => opt.domain === selectedDomain)
  const canGenerate = !generating

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Mail className="h-6 w-6 mr-2 text-blue-600" />
              Generate Temporary Email
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a new temporary email address for privacy and testing
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Plan
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Custom Username Input */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Username (Optional)
          </label>
          <input
            type="text"
            id="username"
            value={customUsername}
            onChange={(e) => setCustomUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
            placeholder="myemail"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">
            Only lowercase letters and numbers. Leave empty for auto-generated username.
          </p>
        </div>

        {/* Domain Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Domain
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domainOptions.map((option) => (
              <DomainCard
                key={option.domain}
                option={option}
                isSelected={selectedDomain === option.domain}
                canAccess={canAccessDomain(user.subscription_tier, option.tier)}
                onSelect={() => setSelectedDomain(option.domain)}
                onUpgrade={onUpgrade}
              />
            ))}
          </div>
        </div>

        {/* Generation Button */}
        <div className="text-center">
          <button
            onClick={generateEmail}
            disabled={!canGenerate}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {generating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Generate Email
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Success Display */}
        {lastGenerated && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium">Email generated successfully!</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <code className="bg-green-100 text-green-800 px-3 py-1 rounded font-mono text-sm">
                      {lastGenerated}
                    </code>
                    <button
                      onClick={() => copyToClipboard(lastGenerated)}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Domain Preview */}
        {selectedOption && selectedOption.domain !== 'random' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Email Preview:</h4>
            <code className="text-blue-800">
              {customUsername || 'username'}@{selectedOption.domain}
            </code>
          </div>
        )}
      </div>
    </div>
  )
}