
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/auth'
import { Mail, Copy, RefreshCw, Clock, Crown, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRealtimeEmails } from '@/hooks/useAdvancedPolling'
import { ConnectionStatus } from '@/components/realtime/ConnectionStatus'
import { useNotifications } from '@/components/realtime/NotificationSystem'

interface TempEmail {
  id: string
  email_address: string
  domain: string
  expires_at: string
  custom_domain: boolean
  email_messages: EmailMessage[]
}

interface EmailMessage {
  id: string
  sender: string
  subject: string
  received_at: string
  is_read: boolean
}

interface EmailGeneratorProps {
  userTier: string
  userId: string
  onUpgrade: () => void
}

export function EmailGenerator({ userTier, userId, onUpgrade }: EmailGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copiedEmail, setCopiedEmail] = useState('')

  const supabase = createClientComponentClient()
  const { notifyNewEmail, notifyError } = useNotifications()

  // Use advanced polling for real-time email updates
  const {
    data: emailsData,
    loading,
    error: pollingError,
    isPolling,
    isOnline,
    consecutiveErrors,
    lastSuccessTime,
    lastErrorTime,
    startPolling,
    stopPolling,
    forcePoll
  } = useRealtimeEmails(userId)

  const emails = emailsData?.emails || []

  const domainOptions = [
    { domain: 'random', name: 'Random Domain', tier: 'free' },
    { domain: 'techsci.dev', name: 'TechSci Dev', tier: 'quick', icon: '🔧' },
    { domain: 'techsci.xyz', name: 'TechSci XYZ', tier: 'quick', icon: '🚀' },
    { domain: 'negoman.com', name: 'Negoman', tier: 'extended', icon: '💼', popular: true },
    { domain: 'techsci.tech', name: 'TechSci Tech', tier: 'pro', icon: '👑' },
  ]

  // Start polling when component mounts
  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  // Handle polling errors
  useEffect(() => {
    if (pollingError) {
      notifyError('Connection Error', 'Failed to fetch latest emails')
    }
  }, [pollingError, notifyError])

  const generateEmail = async () => {
    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customDomain: selectedDomain && selectedDomain !== 'random' ? selectedDomain : null 
        })
      })

      const data = await response.json()

      if (response.status === 402) {
        // Premium feature required
        setError(data.message)
        onUpgrade()
        return
      }

      if (!response.ok) {
        setError(data.message || 'Failed to generate email')
        return
      }

      // Force refresh emails list
      await forcePoll()
      
      // Notify user of successful email generation
      if (data.email) {
        notifyNewEmail(data.email)
      }

    } catch (err) {
      setError('Network error occurred')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(''), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const canAccessDomain = (domainTier: string) => {
    const tierHierarchy = { free: 0, quick: 1, extended: 2, pro: 3 }
    return tierHierarchy[userTier as keyof typeof tierHierarchy] >= 
           tierHierarchy[domainTier as keyof typeof tierHierarchy]
  }

  const getTimeRemaining = (expiresAt: string) => {
    return formatDistanceToNow(new Date(expiresAt), { addSuffix: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading emails...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Generate Email</h2>
        <ConnectionStatus
          isOnline={isOnline}
          isPolling={isPolling}
          consecutiveErrors={consecutiveErrors}
          lastSuccessTime={lastSuccessTime}
          lastErrorTime={lastErrorTime}
          onRetry={forcePoll}
        />
      </div>

      {/* Domain Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Domain</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {domainOptions.map((option) => {
            const canAccess = canAccessDomain(option.tier)
            const isSelected = selectedDomain === option.domain

            return (
              <button
                key={option.domain}
                onClick={() => canAccess && setSelectedDomain(option.domain)}
                disabled={!canAccess}
                className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : canAccess
                    ? 'border-gray-200 hover:border-gray-300 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {option.icon && <span className="text-lg">{option.icon}</span>}
                    <span className={`font-medium ${canAccess ? 'text-gray-900' : 'text-gray-400'}`}>
                      {option.name}
                    </span>
                  </div>
                  {option.popular && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                
                {!canAccess && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Crown className="h-4 w-4" />
                      <span>Requires {option.tier}</span>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Generate Button */}
      <div className="text-center">
        <button
          onClick={generateEmail}
          disabled={generating}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Mail className="h-5 w-5 mr-2" />
              Generate Email
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Generated Emails */}
      {emails.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Your Temporary Emails</h3>
            <button
              onClick={forcePoll}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
          <div className="space-y-4">
            {emails.map((email) => (
              <div key={email.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="font-mono text-lg">{email.email_address}</span>
                    <button
                      onClick={() => copyToClipboard(email.email_address)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedEmail === email.email_address ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {email.custom_domain && (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>Messages: {email.email_messages.length}</span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Expires {getTimeRemaining(email.expires_at)}
                    </span>
                  </div>
                </div>

                {/* Messages Preview */}
                {email.email_messages.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="space-y-2">
                      {email.email_messages.slice(0, 3).map((message) => (
                        <div key={message.id} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{message.sender}</span>
                            <span className="text-gray-500">
                              {formatDistanceToNow(new Date(message.received_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-gray-600 truncate">{message.subject}</p>
                        </div>
                      ))}
                      {email.email_messages.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{email.email_messages.length - 3} more messages
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {emails.length === 0 && !loading && (
        <div className="text-center py-8">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No temporary emails yet. Generate one to get started!</p>
        </div>
      )}
    </div>
  )
}
