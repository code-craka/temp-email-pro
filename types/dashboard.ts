// Core user and subscription types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'free' | 'quick' | 'extended' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trial' | 'inactive';

// Email related types
export interface TempEmail {
  id: string;
  user_id: string;
  email_address: string;
  domain: string;
  provider: EmailProvider;
  expires_at: string;
  custom_domain: boolean;
  is_active: boolean;
  messages_count: number;
  created_at: string;
  email_messages: EmailMessage[];
}

export interface EmailMessage {
  id: string;
  temp_email_id: string;
  sender: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  is_read: boolean;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  download_url: string;
}

export type EmailProvider = 'mail.tm' | 'tempmail.lol' | 'guerrilla' | 'onesec';

// Domain configuration
export interface DomainOption {
  domain: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  icon: React.ReactNode;
  popular?: boolean;
  category: 'free' | 'tech' | 'business' | 'premium';
}

// Usage tracking
export interface DailyUsage {
  id: string;
  user_id: string;
  date: string;
  emails_generated: number;
  emails_received: number;
  api_calls: number;
  storage_used: number;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  today: DailyUsage;
  thisMonth: {
    emails_generated: number;
    emails_received: number;
    api_calls: number;
    storage_used: number;
  };
  limits: {
    emails_per_day: number;
    storage_limit: number;
    retention_hours: number;
    api_calls_per_month: number;
  };
}

// Trial system
export interface TrialStatus {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  started_at: string;
  ends_at: string;
  is_active: boolean;
  converted: boolean;
  created_at: string;
}

// Conversion tracking
export interface ConversionPrompt {
  id: string;
  type: 'urgency' | 'feature' | 'limit' | 'social_proof';
  trigger: 'time_left' | 'message_count' | 'usage_limit' | 'feature_access';
  threshold: number;
  message: string;
  cta_text: string;
  target_tier: SubscriptionTier;
  priority: number;
}

// Analytics and metrics
export interface RealtimeMetrics {
  active_users_count: number;
  emails_generated_today: number;
  messages_received_today: number;
  conversion_rate: number;
  last_updated: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface EmailGenerationResponse {
  email: string;
  domain: string;
  expires_at: string;
  retention_hours: number;
  id: string;
  provider: EmailProvider;
}

export interface MessagePollingResponse {
  messages: EmailMessage[];
  has_new: boolean;
  last_checked: string;
}

// Dashboard state
export interface DashboardData {
  user: User | null;
  emails: TempEmail[];
  usage: UsageStats | null;
  trial: TrialStatus | null;
  metrics: RealtimeMetrics | null;
  loading: boolean;
  error: string | null;
}

// Component props
export interface EmailCardProps {
  email: TempEmail;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onCopy: (email: string) => void;
}

export interface TimerProps {
  expiresAt: string;
  onExpired: () => void;
  className?: string;
}

export interface UsageCardProps {
  title: string;
  current: number;
  limit: number;
  type: 'emails' | 'storage' | 'api_calls';
  tier: SubscriptionTier;
  onUpgrade: () => void;
}

export interface ConversionPromptProps {
  user: User;
  usage: UsageStats;
  emails: TempEmail[];
  onUpgrade: () => void;
}

// Form types
export interface EmailGenerationForm {
  domain: string | null;
  custom_domain: string;
  retention_hours?: number;
}

export interface DomainSelectorProps {
  selectedDomain: string | null;
  onDomainSelect: (domain: string | null) => void;
  userTier: SubscriptionTier;
  trialStatus: TrialStatus | null;
  onUpgrade: () => void;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Hook return types
export interface UseEmailsReturn {
  emails: TempEmail[];
  loading: boolean;
  error: string | null;
  generateEmail: (data: EmailGenerationForm) => Promise<ActionResult<TempEmail>>;
  refreshEmails: () => Promise<void>;
  deleteEmail: (id: string) => Promise<ActionResult>;
}

export interface UseRealtimeReturn {
  metrics: RealtimeMetrics | null;
  connected: boolean;
  lastUpdate: string | null;
}

// Settings and preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    browser: boolean;
    new_messages: boolean;
    expiration_warnings: boolean;
  };
  auto_refresh_interval: number;
  default_retention: number;
}

// Payment related types
export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    emails_per_day: number;
    retention_hours: number;
    custom_domains: boolean;
    api_access: boolean;
    priority_support: boolean;
  };
  popular?: boolean;
  trial_available: boolean;
}

export interface CheckoutSession {
  id: string;
  url: string;
  tier: SubscriptionTier;
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
}