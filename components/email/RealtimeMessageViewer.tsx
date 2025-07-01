'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Mail, 
  MailOpen, 
  User, 
  Clock, 
  Paperclip, 
  RefreshCw, 
  Eye,
  EyeOff,
  CheckCheck,
  ExternalLink
} from 'lucide-react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { ConnectionStatusCompact } from '@/components/realtime/ConnectionStatus';

interface EmailMessage {
  id: string;
  temp_email_id: string;
  sender: string;
  subject: string;
  body_text: string;
  body_html: string;
  received_at: string;
  is_read: boolean;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
  }>;
}

interface RealtimeMessageViewerProps {
  emailId: string;
  emailAddress: string;
  onMessageClick?: (message: EmailMessage) => void;
  showPreview?: boolean;
  maxMessages?: number;
  className?: string;
}

export function RealtimeMessageViewer({
  emailId,
  emailAddress,
  onMessageClick,
  showPreview = true,
  maxMessages = 10,
  className = '',
}: RealtimeMessageViewerProps) {
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [showAllMessages, setShowAllMessages] = useState(false);

  const {
    messages,
    unreadMessages,
    stats,
    loading,
    isPolling,
    isOnline,
    consecutiveErrors,
    hasRecentActivity,
    forcePoll,
    markAsRead,
    markAllAsRead,
    getMessagePreview,
  } = useRealtimeMessages(emailId, emailAddress);

  const displayMessages = showAllMessages ? messages : messages.slice(0, maxMessages);

  const handleMessageClick = (message: EmailMessage) => {
    setSelectedMessage(message);
    if (onMessageClick) {
      onMessageClick(message);
    }
    
    // Mark as read if not already read
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!emailId) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Select an email to view messages</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{stats.total}</span>
            <span className="text-gray-500 ml-1">
              {stats.total === 1 ? 'message' : 'messages'}
            </span>
          </div>
          
          {stats.unread > 0 && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {stats.unread} unread
            </div>
          )}

          {hasRecentActivity && (
            <div className="flex items-center text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Recent activity
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <ConnectionStatusCompact
            isOnline={isOnline}
            isPolling={isPolling}
            consecutiveErrors={consecutiveErrors}
          />
          
          <button
            onClick={forcePoll}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            title="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      {messages.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No messages yet</p>
          <p className="text-sm mt-2">Messages will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayMessages.map((message) => (
            <div
              key={message.id}
              onClick={() => handleMessageClick(message)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                message.is_read
                  ? 'bg-white border-gray-200 hover:border-gray-300'
                  : 'bg-blue-50 border-blue-200 hover:border-blue-300'
              } ${selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {message.is_read ? (
                    <MailOpen className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Mail className="w-5 h-5 text-blue-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm truncate ${
                        message.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'
                      }`}>
                        {message.sender}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(message.received_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <h4 className={`mt-1 text-sm truncate ${
                    message.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'
                  }`}>
                    {message.subject || 'No subject'}
                  </h4>

                  {showPreview && message.body_text && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {getMessagePreview(message, 120)}
                    </p>
                  )}

                  {/* Attachments indicator */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Paperclip className="w-3 h-3 mr-1" />
                      <span>{message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {!message.is_read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Show more button */}
          {messages.length > maxMessages && !showAllMessages && (
            <button
              onClick={() => setShowAllMessages(true)}
              className="w-full p-3 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Show {messages.length - maxMessages} more messages
            </button>
          )}

          {showAllMessages && messages.length > maxMessages && (
            <button
              onClick={() => setShowAllMessages(false)}
              className="w-full p-3 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Selected Message Modal/Detail View */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedMessage.subject || 'No subject'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    From: {selectedMessage.sender}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(selectedMessage.received_at), { addSuffix: true })}
                </span>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Attachments */}
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Attachments ({selectedMessage.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedMessage.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{attachment.filename}</span>
                        <span className="text-gray-500">
                          ({formatFileSize(attachment.size)})
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 ml-auto">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Body */}
              <div className="prose max-w-none">
                {selectedMessage.body_html ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                    className="message-content"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">
                    {selectedMessage.body_text || 'No content available'}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}