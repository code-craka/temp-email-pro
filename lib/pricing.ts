
export const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      emailsPerDay: 5,
      retentionHours: 1,
      customDomains: false,
      apiAccess: false,
      forwardingRules: 0,
    },
    features: ['Basic temporary emails', '1-hour retention', '5 emails/day']
  },
  quick: {
    id: 'quick',
    name: 'Quick',
    price: 0.99,
    priceId: 'price_quick_monthly',
    limits: {
      emailsPerDay: 25,
      retentionHours: 24,
      customDomains: true,
      apiAccess: false,
      forwardingRules: 2,
    },
    features: ['24-hour retention', 'Custom domains', '25 emails/day', 'Email forwarding']
  },
  extended: {
    id: 'extended',
    name: 'Extended',
    price: 2.99,
    priceId: 'price_extended_monthly',
    popular: true,
    limits: {
      emailsPerDay: 100,
      retentionHours: 168, // 7 days
      customDomains: true,
      apiAccess: true,
      forwardingRules: 10,
      bulkCreation: 10,
    },
    features: ['7-day retention', 'API access', '100 emails/day', 'Bulk creation', 'Priority support']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    priceId: 'price_pro_monthly',
    limits: {
      emailsPerDay: 500,
      retentionHours: 720, // 30 days
      customDomains: true,
      apiAccess: true,
      forwardingRules: 50,
      bulkCreation: 100,
      webhooks: true,
    },
    features: ['30-day retention', 'Unlimited API', '500 emails/day', 'Webhooks', 'Advanced analytics']
  }
} as const;
