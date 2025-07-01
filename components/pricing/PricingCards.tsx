'use client';

import { useState } from 'react';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { PRICING_TIERS } from '@/lib/pricing';

export function PricingCards() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (tierId: string) => {
    setIsLoading(tierId);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: PRICING_TIERS[tierId].priceId,
          tier: tierId 
        }),
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {      console.error('Upgrade failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
      {Object.entries(PRICING_TIERS).map(([key, tier]) => (
        <div
          key={key}
          className={`
            relative rounded-2xl border-2 p-6 shadow-lg transition-all hover:shadow-xl
            ${tier.popular 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
          `}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
          )}
          
          <div className="text-center">
            <div className="mb-4">
              {key === 'free' && <Zap className="h-8 w-8 mx-auto text-gray-500" />}
              {key === 'quick' && <Check className="h-8 w-8 mx-auto text-green-500" />}
              {key === 'extended' && <Crown className="h-8 w-8 mx-auto text-blue-500" />}
              {key === 'pro' && <Rocket className="h-8 w-8 mx-auto text-purple-500" />}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
            
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${tier.price}
              </span>
              {tier.price > 0 && (
                <span className="text-gray-500">/month</span>
              )}
            </div>
            
            <ul className="space-y-3 mb-6 text-sm">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleUpgrade(key)}
              disabled={isLoading === key || key === 'free'}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold transition-colors
                ${tier.popular
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
                }
                ${key === 'free' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                disabled:opacity-50
              `}
            >
              {isLoading === key ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : key === 'free' ? (
                'Current Plan'
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
