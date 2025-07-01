'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Mail, 
  BarChart3, 
  Settings, 
  LogOut, 
  Crown, 
  Users, 
  RefreshCw,
  Menu,
  X,
  Home,
  CreditCard,
  FileText,
  Shield,
  Bell,
  Globe
} from 'lucide-react'
import { User } from '@/app/dashboard/page'
import { TrialBanner } from '@/components/trial/TrialBanner'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: User
  activeUsersCount: number
  onSignOut: () => void
  onUpgrade: () => void
  onRefresh: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
  { name: 'Emails', href: '/dashboard/emails', icon: Mail, current: false },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, current: false },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, current: false },
  { name: 'API', href: '/dashboard/api', icon: Globe, current: false },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: false },
]

const getTierInfo = (tier: string) => {
  switch (tier) {
    case 'free':
      return { name: 'Free', color: 'gray', icon: '🆓', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
    case 'quick':
      return { name: 'Quick', color: 'blue', icon: '⚡', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
    case 'extended':
      return { name: 'Extended', color: 'purple', icon: '🚀', bgColor: 'bg-purple-100', textColor: 'text-purple-800' }
    case 'pro':
      return { name: 'Pro', color: 'gold', icon: '👑', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' }
    default:
      return { name: 'Free', color: 'gray', icon: '🆓', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
  }
}

const isTrialActive = (user: User): boolean => {
  return user.trial_ends_at ? new Date(user.trial_ends_at) > new Date() : false
}

const getTrialDaysRemaining = (user: User): number => {
  if (!user.trial_ends_at) return 0
  const trialEnd = new Date(user.trial_ends_at)
  const now = new Date()
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function DashboardLayout({ 
  children, 
  user, 
  activeUsersCount, 
  onSignOut, 
  onUpgrade, 
  onRefresh 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()
  const pathname = usePathname()

  const tierInfo = getTierInfo(user.subscription_tier)
  const trialActive = isTrialActive(user)
  const trialDaysRemaining = getTrialDaysRemaining(user)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Update navigation current state based on pathname
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: pathname === item.href
  }))

  const handleNavigation = (href: string) => {
    router.push(href)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trial Banner */}
      {trialActive && (
        <TrialBanner
          daysRemaining={trialDaysRemaining}
          onUpgrade={onUpgrade}
        />
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">TempEmailPro</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <SidebarContent 
              navigation={updatedNavigation}
              user={user}
              tierInfo={tierInfo}
              activeUsersCount={activeUsersCount}
              onNavigation={handleNavigation}
              onUpgrade={onUpgrade}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col">
        <div className="flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">TempEmailPro</h1>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <SidebarContent 
            navigation={updatedNavigation}
            user={user}
            tierInfo={tierInfo}
            activeUsersCount={activeUsersCount}
            onNavigation={handleNavigation}
            onUpgrade={onUpgrade}
            onSignOut={onSignOut}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col lg:ml-64">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Page title and breadcrumb */}
            <div className="flex-1 lg:flex lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.full_name || user.email.split('@')[0]}!
                </h1>
                <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                  <span>Dashboard</span>
                  <span>•</span>
                  <span>{tierInfo.name} Plan</span>
                  {trialActive && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600 font-medium">
                        {trialDaysRemaining} days trial left
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Header actions */}
              <div className="hidden lg:flex lg:items-center lg:space-x-4">
                {/* Active users indicator */}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Users className="h-4 w-4" />
                    <span>{activeUsersCount} online</span>
                  </div>
                </div>

                {/* Refresh button */}
                <button
                  onClick={onRefresh}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Refresh dashboard"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>

                {/* Upgrade button for free users */}
                {user.subscription_tier === 'free' && (
                  <button
                    onClick={onUpgrade}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
                  >
                    <Crown className="h-4 w-4 mr-1 inline" />
                    Upgrade
                  </button>
                )}

                {/* Notifications */}
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Bell className="h-5 w-5" />
                </button>

                {/* Settings */}
                <button 
                  onClick={() => handleNavigation('/dashboard/settings')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: typeof navigation
  user: User
  tierInfo: ReturnType<typeof getTierInfo>
  activeUsersCount: number
  onNavigation: (href: string) => void
  onUpgrade: () => void
  onSignOut: () => void
}

function SidebarContent({ 
  navigation, 
  user, 
  tierInfo, 
  activeUsersCount, 
  onNavigation, 
  onUpgrade, 
  onSignOut 
}: SidebarContentProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* User profile section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.full_name || user.email.split('@')[0]}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierInfo.bgColor} ${tierInfo.textColor}`}>
                <span className="mr-1">{tierInfo.icon}</span>
                {tierInfo.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.name}
              onClick={() => onNavigation(item.href)}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                item.current
                  ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${item.current ? 'text-blue-500' : 'text-gray-400'}`} />
              {item.name}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Active users */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Users className="h-4 w-4" />
            <span>{activeUsersCount} online</span>
          </div>
        </div>

        {/* Upgrade prompt for free users */}
        {user.subscription_tier === 'free' && (
          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Crown className="h-4 w-4 mr-1 inline" />
            Upgrade for $0.99/mo
          </button>
        )}

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}