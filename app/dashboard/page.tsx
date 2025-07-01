'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/auth';
import { Mail, Zap, Users, Clock, Shield, Sparkles } from 'lucide-react';
import { SmartConversionPrompts } from '@/components/conversion/SmartConversionPrompts';
import type { 
  User, 
  DashboardData, 
  TempEmail, 
  SubscriptionTier,
  RealtimeMetrics,
  UsageStats
} from '@/types/dashboard';

// Dashboard Layout Component
interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  metrics: RealtimeMetrics | null;
  onSignOut: () => void;
}

function DashboardLayout({ children, user, metrics, onSignOut }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-glass-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-gradient text-xl font-bold">TempMail Pro</div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow"></div>
              <span className="text-sm text-muted-foreground">
                {metrics?.active_users_count || 0} users online
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-muted-foreground">Plan:</span>
                <span className="ml-2 font-semibold capitalize">{user.subscription_tier}</span>
              </div>
            </div>
            
            <button
              onClick={onSignOut}
              className="glass-hover px-4 py-2 rounded-lg text-sm font-medium transition-all touch-target"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Real-time Active Users Counter */}
      <div className="fixed bottom-4 right-4 no-print">
        <div className="glass rounded-full px-4 py-2 flex items-center space-x-2 animate-slide-up">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {metrics?.active_users_count || 0}
          </span>
          <span className="text-xs text-muted-foreground">online</span>
        </div>
      </div>
    </div>
  );
}

// Email Generation Form Component
interface EmailGenerationFormProps {
  user: User;
  onEmailGenerated: (email: TempEmail) => void;
  onUpgrade: () => void;
}

function EmailGenerationForm({ user, onEmailGenerated, onUpgrade }: EmailGenerationFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const domains = [
    { value: null, label: 'Random Domain', tier: 'free' as SubscriptionTier },
    { value: 'techsci.dev', label: 'TechSci Dev', tier: 'quick' as SubscriptionTier },
    { value: 'negoman.com', label: 'Negoman', tier: 'extended' as SubscriptionTier },
    { value: 'techsci.tech', label: 'TechSci Tech', tier: 'pro' as SubscriptionTier }
  ];

  const canAccessDomain = (requiredTier: SubscriptionTier) => {
    const tiers = ['free', 'quick', 'extended', 'pro'];
    return tiers.indexOf(user.subscription_tier) >= tiers.indexOf(requiredTier);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: selectedDomain,
          custom_domain: selectedDomain !== null 
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate email');
      }

      onEmailGenerated(result.data);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Generate New Email</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Choose Domain</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {domains.map((domain) => {
              const canAccess = canAccessDomain(domain.tier);
              const isSelected = selectedDomain === domain.value;
              
              return (
                <button
                  key={domain.value || 'random'}
                  onClick={() => canAccess ? setSelectedDomain(domain.value) : onUpgrade()}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left touch-target
                    ${isSelected 
                      ? 'border-primary bg-primary/5' 
                      : canAccess 
                        ? 'border-border hover:border-primary/50 glass-hover' 
                        : 'border-border bg-muted/50 opacity-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{domain.label}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {domain.tier} tier
                      </div>
                    </div>
                    {!canAccess && <Shield className="w-4 h-4 text-warning" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full gradient-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 touch-target"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </div>
          ) : (
            'Generate Email'
          )}
        </button>
      </div>
    </div>
  );
}

// Usage Statistics Component
interface UsageStatsProps {
  usage: UsageStats | null;
  tier: SubscriptionTier;
  onUpgrade: () => void;
}

function UsageStats({ usage, tier, onUpgrade }: UsageStatsProps) {
  const stats = [
    {
      label: 'Emails Today',
      current: usage?.today.emails_generated || 0,
      limit: usage?.limits.emails_per_day || 5,
      icon: Mail,
      color: 'text-primary'
    },
    {
      label: 'Messages Received',
      current: usage?.today.emails_received || 0,
      limit: usage?.limits.emails_per_day ? usage?.limits.emails_per_day * 3 : 15,
      icon: Zap,
      color: 'text-success'
    },
    {
      label: 'Storage Used',
      current: usage?.today.storage_used || 0,
      limit: usage?.limits.storage_limit || 10,
      icon: Sparkles,
      color: 'text-primary'
    },
    {
      label: 'API Calls',
      current: usage?.thisMonth.api_calls || 0,
      limit: usage?.limits.api_calls_per_month || 100,
      icon: Clock,
      color: 'text-warning'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const percentage = Math.min((stat.current / stat.limit) * 100, 100);
        const isNearLimit = percentage > 80;
        
        return (
          <div key={stat.label} className="glass rounded-2xl p-6 glass-hover animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-current/10 ${stat.color}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {isNearLimit && tier === 'free' && (
                <button
                  onClick={onUpgrade}
                  className="text-xs px-2 py-1 bg-warning/10 text-warning rounded-full font-medium hover:bg-warning/20 transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-2xl">{stat.current}</span>
                <span className="text-sm text-muted-foreground">/ {stat.limit}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    percentage > 90 ? 'bg-destructive' :
                    percentage > 70 ? 'bg-warning' : 
                    'bg-success'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Active Emails List Component
interface ActiveEmailsProps {
  emails: TempEmail[];
  onRefresh: () => void;
  onCopy: (email: string) => void;
}

function ActiveEmails({ emails, onRefresh, onCopy }: ActiveEmailsProps) {
  if (emails.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Active Emails</h3>
        <p className="text-muted-foreground">Generate your first temporary email to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Active Emails</h3>
        <button
          onClick={onRefresh}
          className="glass-hover px-3 py-2 rounded-lg text-sm font-medium transition-all touch-target"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        {emails.map((email, index) => (
          <EmailCard 
            key={email.id} 
            email={email} 
            onCopy={onCopy} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

// Email Card Component
interface EmailCardProps {
  email: TempEmail;
  onCopy: (email: string) => void;
  index: number;
}

function EmailCard({ email, onCopy, index }: EmailCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(email.expires_at).getTime();
      const difference = expires - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Expired');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [email.expires_at]);

  return (
    <div 
      className="glass rounded-xl p-4 glass-hover animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
              {email.email_address}
            </code>
            <button
              onClick={() => onCopy(email.email_address)}
              className="glass-hover px-2 py-1 rounded text-xs font-medium transition-all"
            >
              Copy
            </button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{timeLeft}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Mail className="w-3 h-3" />
              <span>{email.messages_count} messages</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {email.custom_domain && (
            <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
              Premium
            </div>
          )}
          {email.messages_count > 0 && (
            <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow"></div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    user: null,
    emails: [],
    usage: null,
    trial: null,
    metrics: null,
    loading: true,
    error: null
  });
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  const loadDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login');
        return;
      }

      // Mock data for demonstration
      const mockUser: User = {
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || null,
        subscription_tier: 'free',
        subscription_status: 'active',
        trial_ends_at: null,
        stripe_customer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockUsage: UsageStats = {
        today: {
          id: '1',
          user_id: authUser.id,
          date: new Date().toISOString().split('T')[0],
          emails_generated: 2,
          emails_received: 5,
          api_calls: 0,
          storage_used: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        thisMonth: {
          emails_generated: 15,
          emails_received: 42,
          api_calls: 0,
          storage_used: 0
        },
        limits: {
          emails_per_day: 5,
          storage_limit: 100,
          retention_hours: 1,
          api_calls_per_month: 100
        }
      };

      const mockMetrics: RealtimeMetrics = {
        active_users_count: 127,
        emails_generated_today: 1847,
        messages_received_today: 5231,
        conversion_rate: 0.12,
        last_updated: new Date().toISOString()
      };

      setData({
        user: mockUser,
        emails: [],
        usage: mockUsage,
        trial: null,
        metrics: mockMetrics,
        loading: false,
        error: null
      });

    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard'
      }));
    }
  }, [supabase.auth, router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleEmailGenerated = (email: TempEmail) => {
    setData(prev => ({
      ...prev,
      emails: [email, ...prev.emails]
    }));
  };

  const handleCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (data.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center animate-fade-in">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (data.error || !data.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center max-w-md animate-fade-in">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">
            {data.error || 'Unable to load dashboard'}
          </h2>
          <p className="text-muted-foreground mb-6">
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <div className="space-x-3">
            <button 
              onClick={() => window.location.reload()}
              className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="glass-hover px-4 py-2 rounded-lg transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      user={data.user}
      metrics={data.metrics}
      onSignOut={handleSignOut}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {data.user.full_name || 'User'}! 
          <Sparkles className="inline-block w-6 h-6 ml-2 text-primary" />
        </h1>
        <p className="text-muted-foreground">
          Manage your temporary emails and track your usage below.
        </p>
      </div>

      {/* Smart Conversion Prompts */}
      <SmartConversionPrompts
        user={data.user}
        usage={data.usage}
        emails={data.emails}
        onUpgrade={handleUpgrade}
      />

      {/* Usage Statistics */}
      <UsageStats 
        usage={data.usage}
        tier={data.user.subscription_tier}
        onUpgrade={handleUpgrade}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Generation */}
        <EmailGenerationForm
          user={data.user}
          onEmailGenerated={handleEmailGenerated}
          onUpgrade={handleUpgrade}
        />

        {/* Active Emails */}
        <div className="glass rounded-2xl p-6">
          <ActiveEmails
            emails={data.emails}
            onRefresh={loadDashboardData}
            onCopy={handleCopy}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}