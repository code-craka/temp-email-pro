'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  Crown, 
  Copy, 
  CheckCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { TempEmail, User, EmailMessage } from '@/app/dashboard/page'

interface EmailListSectionProps {
  emails: TempEmail[]
  user: User
  onRefresh: () => void
}

interface EmailCardProps {
  email: TempEmail
  onCopy: (email: string) => void
  copiedEmail: string
  onToggleMessages: (emailId: string) => void
  expandedEmails: Set<string>
}

function EmailCard({ email, onCopy, copiedEmail, onToggleMessages, expandedEmails }: EmailCardProps) {
  const isExpanded = expandedEmails.has(email.id)
  const isExpired = new Date(email.expires_at) < new Date()
  const timeRemaining = formatDistanceToNow(new Date(email.expires_at), { addSuffix: true })

  return (
    <div className={`bg-white border rounded-lg transition-all hover:shadow-md ${
      isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200'
    }`}>
      {/* Email Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${
              isExpired ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded truncate">
                  {email.email_address}
                </code>
                <button
                  onClick={() => onCopy(email.email_address)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy email address"
                >
                  {copiedEmail === email.email_address ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{email.messages_count} messages</span>
                </span>
                <span className={`flex items-center space-x-1 ${
                  isExpired ? 'text-red-600' : 'text-gray-500'
                }`}>
                  <Clock className="h-4 w-4" />
                  <span>{isExpired ? 'Expired' : `Expires ${timeRemaining}`}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {email.custom_domain && (
              <Crown className="h-5 w-5 text-yellow-500" title="Custom domain" />
            )}
            
            {email.messages_count > 0 && (
              <button
                onClick={() => onToggleMessages(email.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={isExpanded ? 'Hide messages' : 'Show messages'}
              >
                {isExpanded ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isExpired 
              ? 'bg-red-100 text-red-800' 
              : email.messages_count > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isExpired ? 'Expired' : email.messages_count > 0 ? 'Active' : 'Waiting'}
          </span>
          
          {email.custom_domain && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Crown className="h-3 w-3 mr-1" />
              Premium Domain
            </span>
          )}
        </div>
      </div>

      {/* Messages Section */}
      {isExpanded && email.email_messages && email.email_messages.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Messages ({email.email_messages.length})
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {email.email_messages.slice(0, 5).map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
            {email.email_messages.length > 5 && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  +{email.email_messages.length - 5} more messages
                </p>
                <button className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                  View all messages
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty Messages State */}
      {isExpanded && email.messages_count === 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No messages received yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Messages will appear here when someone sends to this email
          </p>
        </div>
      )}
    </div>
  )
}

interface MessageCardProps {
  message: EmailMessage
}

function MessageCard({ message }: MessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900 truncate">
              {message.sender}
            </span>
            {!message.is_read && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
          <p className="text-sm text-gray-700 mb-2 truncate">
            {message.subject}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(message.received_at), { addSuffix: true })}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && message.body_text && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans">
              {message.body_text.slice(0, 500)}
              {message.body_text.length > 500 && '...'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export function EmailListSection({ emails, user, onRefresh }: EmailListSectionProps) {
  const [copiedEmail, setCopiedEmail] = useState('')
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  const copyToClipboard = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(''), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const toggleMessages = (emailId: string) => {
    const newExpanded = new Set(expandedEmails)
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId)
    } else {
      newExpanded.add(emailId)
    }
    setExpandedEmails(newExpanded)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const activeEmails = emails.filter(email => new Date(email.expires_at) > new Date())
  const expiredEmails = emails.filter(email => new Date(email.expires_at) <= new Date())

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mail className="h-6 w-6 mr-2 text-blue-600" />
            Your Temporary Emails
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your active temporary email addresses and view received messages
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Active Emails */}
      {activeEmails.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Active Emails ({activeEmails.length})
          </h3>
          <div className="space-y-4">
            {activeEmails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                onCopy={copyToClipboard}
                copiedEmail={copiedEmail}
                onToggleMessages={toggleMessages}
                expandedEmails={expandedEmails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired Emails */}
      {expiredEmails.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Expired Emails ({expiredEmails.length})
          </h3>
          <div className="space-y-4">
            {expiredEmails.slice(0, 3).map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                onCopy={copyToClipboard}
                copiedEmail={copiedEmail}
                onToggleMessages={toggleMessages}
                expandedEmails={expandedEmails}
              />
            ))}
            {expiredEmails.length > 3 && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  +{expiredEmails.length - 3} more expired emails
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {emails.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No temporary emails yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Generate your first temporary email address to get started with secure, private email communication.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="text-sm text-gray-500">
              🔒 Private & Secure
            </div>
            <div className="text-sm text-gray-500">
              ⚡ Instant Generation
            </div>
            <div className="text-sm text-gray-500">
              🚀 No Registration Required
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-medium text-blue-900 mb-1">Email Management Tips</h4>
            <ul className="text-blue-800 space-y-1">
              <li>• Emails refresh automatically every 30 seconds</li>
              <li>• Click the eye icon to view received messages</li>
              <li>• Copy email addresses with one click</li>
              <li>• Expired emails are kept for reference but won't receive new messages</li>
              {user.subscription_tier === 'free' && (
                <li>• Upgrade to get longer retention times and custom domains</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}