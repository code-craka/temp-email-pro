'use client';

import { useState, useEffect } from 'react';
import { X, Star, Clock } from 'lucide-react';

interface TrialBannerProps {
  trialStatus: any;
  onStartTrial: () => void;
  onUpgrade: () => void;
}

export function TrialBanner({ trialStatus, onStartTrial, onUpgrade }: TrialBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  // Show trial CTA for users who haven't started trial
  if (!trialStatus.hasUsedTrial) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 relative">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-white/80 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Star className="h-6 w-6 text-yellow-300" />
            <div>
              <h3 className="font-semibold">Start Your FREE 14-Day Premium Trial</h3>
              <p className="text-sm text-blue-100">
                Get custom domains, extended retention, and unlimited emails
              </p>
            </div>
          </div>
          
          <button
            onClick={onStartTrial}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    );
  }

  // Show trial status for active trials
  if (trialStatus.isActive) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 relative">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-green-600 hover:text-green-800"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">
                Premium Trial Active - {trialStatus.daysRemaining} days remaining
              </h3>
              <p className="text-sm text-green-600">
                You're currently enjoying all premium features
              </p>
            </div>
          </div>
          
          <button
            onClick={onUpgrade}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Upgrade Now - 50% Off
          </button>
        </div>
      </div>
    );
  }

  // Show upgrade prompt for expired trials
  return (
    <div className="bg-orange-50 border border-orange-200 p-4 relative">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-orange-600 hover:text-orange-800"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-orange-600" />
          <div>
            <h3 className="font-semibold text-orange-800">
              Your premium trial has ended
            </h3>
            <p className="text-sm text-orange-600">
              Upgrade to continue using custom domains and extended features
            </p>
          </div>
        </div>
        
        <button
          onClick={onUpgrade}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Upgrade for $2.99
        </button>
      </div>
    </div>
  );
}
