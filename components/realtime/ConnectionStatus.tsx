'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isOnline: boolean;
  isPolling: boolean;
  consecutiveErrors: number;
  lastSuccessTime: number | null;
  lastErrorTime: number | null;
  onRetry?: () => void;
  className?: string;
}

export function ConnectionStatus({
  isOnline,
  isPolling,
  consecutiveErrors,
  lastSuccessTime,
  lastErrorTime,
  onRetry,
  className = '',
}: ConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Determine connection state
  const getConnectionState = () => {
    if (!isOnline) return 'offline';
    if (consecutiveErrors >= 3) return 'error';
    if (consecutiveErrors > 0) return 'warning';
    if (!isPolling) return 'paused';
    return 'connected';
  };

  const connectionState = getConnectionState();

  // Get status color and icon
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'offline':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: WifiOff,
          text: 'Offline',
          description: 'No internet connection',
        };
      case 'error':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: AlertCircle,
          text: 'Connection Error',
          description: `${consecutiveErrors} failed attempts`,
        };
      case 'warning':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: RefreshCw,
          text: 'Reconnecting',
          description: 'Temporary connection issues',
        };
      case 'paused':
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: RefreshCw,
          text: 'Paused',
          description: 'Real-time updates paused',
        };
      case 'connected':
      default:
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          text: 'Connected',
          description: 'Real-time updates active',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Format time ago
  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Status Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${config.bgColor} ${config.borderColor} hover:shadow-sm`}
      >
        <Icon 
          className={`w-4 h-4 ${config.color} ${connectionState === 'warning' ? 'animate-spin' : ''}`}
        />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
        
        {/* Connection pulse indicator */}
        {connectionState === 'connected' && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </button>

      {/* Detailed Status Popup */}
      {showDetails && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-3">
            {/* Current Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm ${config.color}`}>{config.description}</span>
              </div>
            </div>

            {/* Connection Details */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Internet</span>
                <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Real-time Updates</span>
                <span className={isPolling ? 'text-green-600' : 'text-gray-500'}>
                  {isPolling ? 'Active' : 'Paused'}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Failed Attempts</span>
                <span className={consecutiveErrors > 0 ? 'text-red-600' : 'text-gray-500'}>
                  {consecutiveErrors}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Last Success</span>
                <span className="text-gray-500">
                  {formatTimeAgo(lastSuccessTime)}
                </span>
              </div>

              {lastErrorTime && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Last Error</span>
                  <span className="text-red-600">
                    {formatTimeAgo(lastErrorTime)}
                  </span>
                </div>
              )}
            </div>

            {/* Retry Button */}
            {(connectionState === 'error' || connectionState === 'warning') && onRetry && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    onRetry();
                    setShowDetails(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Connection</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for mobile/smaller spaces
export function ConnectionStatusCompact({
  isOnline,
  isPolling,
  consecutiveErrors,
}: {
  isOnline: boolean;
  isPolling: boolean;
  consecutiveErrors: number;
}) {
  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (consecutiveErrors >= 3) return 'bg-red-500';
    if (consecutiveErrors > 0) return 'bg-yellow-500';
    if (!isPolling) return 'bg-gray-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isPolling ? 'animate-pulse' : ''}`}></div>
      <span className="text-xs text-gray-500">
        {!isOnline ? 'Offline' : consecutiveErrors > 0 ? 'Issues' : 'Live'}
      </span>
    </div>
  );
}