'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Crown, Gift, Clock, Users, Star } from 'lucide-react';
import { useABTest, CONVERSION_TESTS } from '@/hooks/useABTesting';
import type { User, SubscriptionTier } from '@/types/dashboard';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpgrade: (tier: SubscriptionTier) => void;
  analytics?: {
    timeSpent: number;
    scrollDepth: number;
    interactionCount: number;
  };
}

interface UpgradeOffer {
  tier: SubscriptionTier;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  features: string[];
  popularBadge?: boolean;
  urgencyText: string;
  ctaText: string;
  highlight: string;
}

export function ExitIntentModal({
  isOpen,
  onClose,
  user,
  onUpgrade,
  analytics,
}: ExitIntentModalProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('quick');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
  const [isAnimating, setIsAnimating] = useState(false);

  // A/B Testing
  const { variant: modalVariant, trackEvent } = useABTest(CONVERSION_TESTS.EXIT_INTENT_MODAL);
  const modalConfig = modalVariant?.config || CONVERSION_TESTS.EXIT_INTENT_MODAL.variants[0].config;

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  // Entrance animation
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine best offer based on user behavior and A/B test
  const getBestOffer = (): UpgradeOffer => {
    // High engagement users get better deals
    const isHighEngagement = analytics && (
      analytics.timeSpent > 60 || 
      analytics.scrollDepth > 70 || 
      analytics.interactionCount > 5
    );

    // Use A/B test discount percentage
    const baseDiscount = modalConfig.discountPercent || 20;

    const baseOffers: Record<SubscriptionTier, UpgradeOffer> = {
      quick: {
        tier: 'quick',
        originalPrice: 0.99,
        discountedPrice: isHighEngagement ? 0.49 : (0.99 * (1 - baseDiscount / 100)),
        discount: isHighEngagement ? 50 : baseDiscount,
        features: [
          '25 emails per day',
          '24-hour retention',
          'Premium domains (techsci.dev, techsci.xyz)',
          'Priority support',
          'No ads'
        ],
        urgencyText: 'Most Popular Choice',
        ctaText: 'Start Quick Plan',
        highlight: 'Perfect for regular users',
        popularBadge: true,
      },
      extended: {
        tier: 'extended',
        originalPrice: 2.99,
        discountedPrice: isHighEngagement ? 1.99 : (2.99 * (1 - baseDiscount / 100)),
        discount: isHighEngagement ? 33 : baseDiscount,
        features: [
          '100 emails per day',
          '1 week retention',
          'All premium domains + negoman.com',
          'Email forwarding',
          'Advanced filters',
          'API access (limited)'
        ],
        urgencyText: 'Best Value',
        ctaText: 'Get Extended Plan',
        highlight: 'Ideal for power users',
      },
      pro: {
        tier: 'pro',
        originalPrice: 9.99,
        discountedPrice: isHighEngagement ? 6.99 : (9.99 * (1 - baseDiscount / 100)),
        discount: isHighEngagement ? 30 : baseDiscount,
        features: [
          '500 emails per day',
          '30-day retention',
          'All premium domains + techsci.tech',
          'Unlimited forwarding',
          'Full API access',
          'Custom webhooks',
          'Priority support',
          'Advanced analytics'
        ],
        urgencyText: 'Ultimate Plan',
        ctaText: 'Go Pro',
        highlight: 'For professionals & businesses',
      },
      free: {
        tier: 'free',
        originalPrice: 0,
        discountedPrice: 0,
        discount: 0,
        features: [],
        urgencyText: '',
        ctaText: '',
        highlight: '',
      }
    };

    // Recommend tier based on current usage pattern
    if (user.subscription_tier === 'free') {
      return baseOffers.quick;
    } else if (user.subscription_tier === 'quick') {
      return baseOffers.extended;
    } else {
      return baseOffers.pro;
    }
  };

  const recommendedOffer = getBestOffer();
  const allOffers = [
    getBestOffer(),
    // Add alternative offers for comparison
    ...(user.subscription_tier === 'free' ? [
      {
        ...getBestOffer(),
        tier: 'extended' as SubscriptionTier,
        originalPrice: 2.99,
        discountedPrice: 1.99,
        discount: 33,
        urgencyText: 'Best Value',
        popularBadge: false,
      }
    ] : [])
  ];

  const handleUpgrade = (tier: SubscriptionTier) => {
    trackEvent('upgrade_clicked', { tier, analytics });
    onUpgrade(tier);
    onClose();
  };

  const handleClose = () => {
    trackEvent('modal_closed', { timeSpent: Date.now() - (isOpen ? Date.now() : 0), analytics });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div 
        className={`bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {modalConfig.title}
            </h2>
            
            <p className="text-lg text-gray-600 mb-4">
              {modalConfig.subtitle}
            </p>

            {/* Urgency Timer */}
            {modalConfig.urgencyTimer && (
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">This offer expires in {formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Social Proof */}
        {modalConfig.socialProof && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>2,847 users upgraded today</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>4.9/5 rating (1,203 reviews)</span>
              </div>
            </div>
          </div>
        )}

        {/* Offers */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {allOffers.map((offer) => (
              <div
                key={offer.tier}
                className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  offer.popularBadge
                    ? 'border-blue-500 bg-blue-50'
                    : selectedTier === offer.tier
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedTier(offer.tier)}
              >
                {/* Popular Badge */}
                {offer.popularBadge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {offer.urgencyText}
                    </div>
                  </div>
                )}

                {/* Tier Header */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Crown className={`w-6 h-6 ${offer.popularBadge ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 capitalize mb-1">
                    {offer.tier} Plan
                  </h3>
                  
                  <p className="text-sm text-gray-600">{offer.highlight}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${offer.discountedPrice}
                    </span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                  
                  {offer.discount > 0 && (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-sm line-through text-gray-400">
                        ${offer.originalPrice}
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                        Save {offer.discount}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {offer.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <Zap className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(offer.tier)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    offer.popularBadge
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {offer.ctaText}
                </button>
              </div>
            ))}
          </div>

          {/* Guarantee */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-green-50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>30-day money-back guarantee • Cancel anytime • No hidden fees</span>
            </div>
          </div>

          {/* Analytics insights (if provided) */}
          {analytics && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                Based on your {Math.floor(analytics.timeSpent / 60)} minutes on our platform and {analytics.interactionCount} interactions, 
                we recommend the <span className="font-semibold capitalize">{recommendedOffer.tier}</span> plan for your needs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}