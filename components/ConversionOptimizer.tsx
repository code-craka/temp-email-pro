
import { useState, useEffect } from 'react';

interface ConversionOptimizerProps {
  user: any | null;
  messageCount: number;
  timeLeft: number;
  onUpgrade: () => void;
}

export function ConversionOptimizer({ 
  user, 
  messageCount, 
  timeLeft, 
  onUpgrade 
}: ConversionOptimizerProps) {
  const [showUrgencyPrompt, setShowUrgencyPrompt] = useState(false);
  const [showValuePrompt, setShowValuePrompt] = useState(false);

  useEffect(() => {
    // Urgency prompt when <2 minutes left
    if (timeLeft < 120 && !user?.isPremium) {
      setShowUrgencyPrompt(true);
    }
    
    // Value prompt after receiving 3+ emails
    if (messageCount >= 3 && !user?.isPremium) {
      setShowValuePrompt(true);
    }
  }, [timeLeft, messageCount, user]);

  if (showUrgencyPrompt) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-red-800">
              ⏰ Your email expires in {Math.floor(timeLeft / 60)} minutes!
            </h3>
            <p className="text-red-600">
              Upgrade now to keep your emails for 24 hours
            </p>
          </div>
          <button 
            onClick={onUpgrade}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Upgrade for $2.99
          </button>
        </div>
      </div>
    );
  }

  if (showValuePrompt) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">
              🎉 You've received {messageCount} emails!
            </h3>
            <p className="text-blue-600">
              Join 10,000+ users who upgraded for better features
            </p>
          </div>
          <button 
            onClick={onUpgrade}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Start at $0.99
          </button>
        </div>
      </div>
    );
  }

  return null;
}
