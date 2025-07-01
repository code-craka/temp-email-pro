'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/auth';
import { EmailGenerator } from '@/components/email/EmailGenerator';
import { UsageWidget } from '@/components/dashboard/UsageWidget';
import { UpgradePrompts } from '@/components/conversion/UpgradePrompts';
import { SmartUpgradeModal } from '@/components/conversion/SmartUpgradeModal';
import { LogOut, Settings, Crown } from 'lucide-react';

interface User {
  id: string
  email: string
  full_name: string
  subscription_tier: string
  subscription_status: string
}

interface DailyUsage {
  emails_generated: number
  emails_received: number
  api_calls: number
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);
      }

      // Get today's usage
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyUsage } = await supabase
        .from('daily_usage')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('date', today)
        .single();

      setUsage(dailyUsage || { emails_generated: 0, emails_received: 0, api_calls: 0 });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.full_name || user.email}
            </h1>
            <div className="flex items-center mt-2 space-x-2">
              <span className="text-sm text-gray-600">Current plan:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.subscription_tier === 'free' 
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.subscription_tier === 'free' && <span className="mr-1">🆓</span>}
                {user.subscription_tier !== 'free' && <Crown className="h-3 w-3 mr-1" />}
                {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user.subscription_tier === 'free' && (
              <button 
                onClick={handleUpgrade}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade for $0.99/mo
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard/billing')}
              className="text-gray-400 hover:text-gray-600"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Usage Stats */}
        {usage && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <UsageWidget
              title="Emails Generated Today"
              value={usage.emails_generated}
              limit={user.subscription_tier === 'free' ? 5 : user.subscription_tier === 'quick' ? 25 : user.subscription_tier === 'extended' ? 100 : 500}
              type="emails"
              tier={user.subscription_tier}
              onUpgrade={handleUpgrade}
            />
            <UsageWidget
              title="Messages Received"
              value={usage.emails_received}
              limit={null}
              type="messages"
              tier={user.subscription_tier}
              onUpgrade={handleUpgrade}
            />
            <UsageWidget
              title="API Calls"
              value={usage.api_calls}
              limit={user.subscription_tier === 'pro' ? 10000 : null}
              type="api"
              tier={user.subscription_tier}
              onUpgrade={handleUpgrade}
            />
          </div>
        )}

        {/* Upgrade Prompts */}
        <UpgradePrompts 
          userTier={user.subscription_tier}
          usage={usage}
          onUpgrade={handleUpgrade}
        />

        {/* Email Generator */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Generate Temporary Email</h2>
          <EmailGenerator 
            userTier={user.subscription_tier}
            onUpgrade={handleUpgrade}
          />
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <SmartUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            currentTier={user.subscription_tier}
            usage={usage}
          />
        )}
      </div>
    </div>
  );
}
