'use client';

import { useState } from 'react';
import { Check, Crown, Zap, Building, Code, Lock } from 'lucide-react';

interface DomainOption {
  domain: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  icon: React.ReactNode;
  popular?: boolean;
}

interface CustomDomainSelectorProps {
  selectedDomain: string | null;
  onDomainSelect: (domain: string | null) => void;
  userTier: string;
  trialStatus: any;
  onUpgrade: () => void;
}

export function CustomDomainSelector({ 
  selectedDomain, 
  onDomainSelect, 
  userTier, 
  trialStatus,
  onUpgrade 
}: CustomDomainSelectorProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const domainOptions: DomainOption[] = [
    {
      domain: 'random',
      name: 'Random Domain',
      description: 'Use a random temporary email domain',
      tier: 'free',
      category: 'basic',
      icon: <Zap className="h-5 w-5 text-gray-500" />
    },
    {
      domain: 'techsci.dev',
      name: 'TechSci Dev',
      description: 'Perfect for developers and tech professionals',
      tier: 'quick',
      category: 'tech',
      icon: <Code className="h-5 w-5 text-blue-500" />,
      popular: true
    },
    {
      domain: 'techsci.xyz',
      name: 'TechSci XYZ',
      description: 'Modern domain for tech innovators',
      tier: 'quick',
      category: 'tech',
      icon: <Code className="h-5 w-5 text-purple-500" />
    },
    {
      domain: 'negoman.com',
      name: 'Negoman Business',
      description: 'Professional business communications',
      tier: 'extended',
      category: 'business',
      icon: <Building className="h-5 w-5 text-green-500" />
    },
    {
      domain: 'techsci.tech',
      name: 'TechSci Premium',
      description: 'Premium tech domain for professionals',
      tier: 'pro',
      category: 'premium',
      icon: <Crown className="h-5 w-5 text-yellow-500" />
    }
  ];

  const effectiveTier = trialStatus?.isActive ? 'extended' : userTier;

  const canAccessDomain = (requiredTier: string): boolean => {
    const tierOrder = ['free', 'quick', 'extended', 'pro'];
    const userIndex = tierOrder.indexOf(effectiveTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return userIndex >= requiredIndex;
  };

  const handleDomainClick = (domain: string, requiredTier: string) => {
    if (domain === 'random') {
      onDomainSelect(null);
      return;
    }

    if (!canAccessDomain(requiredTier)) {
      setShowUpgradeModal(true);
      return;
    }

    onDomainSelect(domain);
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      free: { text: 'Free', className: 'bg-gray-100 text-gray-600' },
      quick: { text: 'Quick $0.99', className: 'bg-blue-100 text-blue-700' },
      extended: { text: 'Extended $2.99', className: 'bg-green-100 text-green-700' },
      pro: { text: 'Pro $9.99', className: 'bg-purple-100 text-purple-700' }
    };
    
    const badge = badges[tier] || badges.free;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Choose Your Email Domain</h3>
        {trialStatus?.isActive && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            Trial Active - All Domains Available
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {domainOptions.map((option) => {
          const isSelected = option.domain === 'random' ? !selectedDomain : selectedDomain === option.domain;
          const canAccess = canAccessDomain(option.tier);
          const isLocked = !canAccess && option.domain !== 'random';

          return (
            <div
              key={option.domain}
              onClick={() => handleDomainClick(option.domain, option.tier)}
              className={`
                relative border-2 rounded-lg p-4 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : isLocked
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${option.popular ? 'ring-2 ring-blue-200' : ''}
              `}
            >
              {option.popular && (
                <div className="absolute -top-2 left-4">
                  <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Popular
                  </span>
                </div>
              )}
              
              {isLocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {option.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-semibold text-sm ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                      {option.name}
                    </h4>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  
                  <p className={`text-xs mb-2 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {getTierBadge(option.tier)}
                    
                    {option.domain !== 'random' && (
                      <span className={`text-xs font-mono ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                        @{option.domain}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Unlock Premium Domains
              </h3>
              <p className="text-gray-600 mb-6">
                Get access to professional custom domains and extended email retention
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={onUpgrade}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Start 14-Day Free Trial
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full text-gray-500 py-2"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Benefits */}
      {selectedDomain && selectedDomain !== 'random' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            ✨ Benefits of {domainOptions.find(d => d.domain === selectedDomain)?.name}:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Professional appearance for business communications</li>
            <li>• Higher deliverability rates</li>
            <li>• Extended email retention (up to 30 days)</li>
            <li>• Priority support</li>
          </ul>
        </div>
      )}
