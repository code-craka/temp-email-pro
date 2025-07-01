# Architecture Overview

This document provides a comprehensive overview of TempEmailPro's architecture, design patterns, and technical decisions.

## System Architecture

TempEmailPro follows a modern, scalable architecture designed for high availability and revenue optimization.

```typescript
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Web    │    │   Mobile App    │    │   API Client    │
│   (Next.js)     │    │   (Future)      │    │   (Developer)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Load Balancer       │
                    │        (Vercel)          │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Next.js 15 App       │
                    │    (App Router + API)    │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼──────┐    ┌─────────▼──────┐    ┌─────────▼──────┐
    │  Supabase  │    │    Stripe     │    │  Email Provider │
    │ PostgreSQL │    │   (Payments)  │    │    Services     │
    │    Auth    │    │               │    │  (Mail.tm, etc) │
    │    RLS     │    │               │    │                 │
    └────────────┘    └────────────────┘    └─────────────────┘
```

## Core Components

### 1. Frontend Layer (Next.js 15)

#### App Router Structure

```typescript
app/
├── (auth)/           # Authentication route group
├── api/              # API routes (server-side)
├── dashboard/        # User dashboard
├── pricing/          # Pricing and billing
├── layout.tsx        # Root layout with providers
└── page.tsx          # Landing page
```

#### Key Technologies

- **Next.js 15**: React framework with App Router
- **Tailwind CSS v4.1**: Modern CSS with OKLCH colors
- **TypeScript**: Full type safety
- **Supabase SSR**: Server-side authentication

### 2. API Layer

#### Route Handlers

```typescript
// Standardized API response format
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Error handling pattern
export class PremiumFeatureRequired extends Error {
  constructor(
    message: string,
    public upgradeUrl: string = '/pricing',
    public requiredTier: SubscriptionTier = 'quick'
  ) {
    super(message)
    this.name = 'PremiumFeatureRequired'
  }
}
```

#### Authentication Middleware

```typescript
// middleware.ts - Route protection
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  
  // Refresh session if needed
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protect authenticated routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return response
}
```

### 3. Database Layer (Supabase)

#### Schema Design

```sql
-- Core entity relationships
users (1) ←→ (many) temp_emails
users (1) ←→ (many) daily_usage
temp_emails (1) ←→ (many) email_messages
users (1) ←→ (1) user_trials
```

#### Row Level Security (RLS)

```sql
-- Example RLS policy
CREATE POLICY "users_own_data" ON temp_emails
  FOR ALL USING (user_id = auth.uid());

-- Advanced policy with tier checking
CREATE POLICY "premium_domain_access" ON temp_emails
  FOR INSERT WITH CHECK (
    CASE 
      WHEN domain IN ('techsci.dev', 'techsci.xyz') 
      THEN auth.jwt() ->> 'tier' IN ('quick', 'extended', 'pro')
      ELSE true
    END
  );
```

## Design Patterns

### 1. Repository Pattern

```typescript
// lib/repositories/user-repository.ts
export class UserRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw new Error(`Failed to fetch user: ${error.message}`)
    return data
  }
  
  async updateSubscriptionTier(
    userId: string, 
    tier: SubscriptionTier
  ): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('id', userId)
    
    if (error) throw new Error(`Failed to update tier: ${error.message}`)
  }
}
```

### 2. Service Layer Pattern

```typescript
// lib/services/email-service.ts
export class EmailService {
  constructor(
    private userRepo: UserRepository,
    private emailRepo: EmailRepository,
    private providers: EmailProvider[]
  ) {}
  
  async generateEmail(
    userId: string, 
    options: GenerateEmailOptions
  ): Promise<TempEmail> {
    // 1. Validate user permissions
    const user = await this.userRepo.getUserProfile(userId)
    this.validateUserTier(user, options)
    
    // 2. Check usage limits
    await this.validateUsageLimits(userId, user.tier)
    
    // 3. Generate email with provider fallback
    const email = await this.generateWithFallback(options)
    
    // 4. Save to database
    const tempEmail = await this.emailRepo.create({
      userId,
      email: email.address,
      domain: email.domain,
      expiresAt: this.calculateExpiry(user.tier)
    })
    
    // 5. Track usage
    await this.trackUsage(userId, 'email_generated')
    
    return tempEmail
  }
  
  private async generateWithFallback(
    options: GenerateEmailOptions
  ): Promise<{ address: string; domain: string }> {
    for (const provider of this.providers) {
      try {
        if (await provider.isHealthy()) {
          return await provider.generateEmail(options)
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error)
        continue
      }
    }
    
    throw new Error('All email providers are unavailable')
  }
}
```

### 3. Provider Pattern (Email Providers)

```typescript
// lib/providers/email-provider.interface.ts
export interface EmailProvider {
  name: string
  isHealthy(): Promise<boolean>
  generateEmail(options: GenerateEmailOptions): Promise<EmailResult>
  getMessages(email: string): Promise<EmailMessage[]>
  supportsCustomDomains(): boolean
}

// lib/providers/mail-tm-provider.ts
export class MailTmProvider implements EmailProvider {
  name = 'Mail.tm'
  
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/domains`)
      return response.ok
    } catch {
      return false
    }
  }
  
  async generateEmail(options: GenerateEmailOptions): Promise<EmailResult> {
    const domain = options.customDomain || await this.getRandomDomain()
    const username = options.username || this.generateUsername()
    
    const response = await fetch(`${this.baseUrl}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      },
      body: JSON.stringify({
        address: `${username}@${domain}`,
        password: this.generatePassword()
      })
    })
    
    if (!response.ok) {
      throw new Error(`Mail.tm API error: ${response.statusText}`)
    }
    
    const result = await response.json()
    return {
      address: result.address,
      domain: domain
    }
  }
}
```

## Data Flow

### 1. Email Generation Flow

```
User Request → Authentication → Tier Validation → Usage Check → 
Provider Selection → Email Generation → Database Save → Response
```

```typescript
// Detailed flow implementation
export async function handleEmailGeneration(request: NextRequest) {
  // 1. Authentication
  const user = await authenticateRequest(request)
  if (!user) throw new UnauthorizedError()
  
  // 2. Parse and validate request
  const options = await parseGenerateEmailRequest(request)
  
  // 3. Check user tier and permissions
  const userProfile = await getUserProfile(user.id)
  validateTierAccess(userProfile.tier, options.customDomain)
  
  // 4. Check usage limits
  const usage = await getUserDailyUsage(user.id)
  const limits = getTierLimits(userProfile.tier)
  if (usage.emailsGenerated >= limits.dailyEmails) {
    throw new UsageLimitError('Daily email limit reached')
  }
  
  // 5. Generate email with provider fallback
  const email = await emailService.generateEmail(user.id, options)
  
  // 6. Track analytics
  await trackRevenuEvent({
    userId: user.id,
    event: 'email_generated',
    tier: userProfile.tier,
    customDomain: options.customDomain
  })
  
  return email
}
```

### 2. Subscription Management Flow

```
Stripe Webhook → Signature Verification → Event Processing → 
Database Update → User Notification → Analytics Tracking
```

```typescript
// lib/services/subscription-service.ts
export class SubscriptionService {
  async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.activateSubscription(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await this.updateSubscription(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await this.recordPayment(event.data.object)
        break
    }
  }
  
  private async activateSubscription(subscription: Stripe.Subscription) {
    const tier = this.mapStripePriceToTier(subscription.items.data[0].price.id)
    
    await this.userRepo.updateSubscriptionTier(
      subscription.metadata.userId,
      tier
    )
    
    await this.trackRevenueEvent({
      userId: subscription.metadata.userId,
      event: 'subscription_activated',
      tier,
      amount: subscription.items.data[0].price.unit_amount / 100
    })
  }
}
```

## Security Architecture

### 1. Authentication & Authorization

```typescript
// Multi-layer security approach
export const securityLayers = {
  // Layer 1: Route protection (middleware)
  routeProtection: (request: NextRequest) => {
    return authenticateSession(request)
  },
  
  // Layer 2: API authentication
  apiAuthentication: async (request: NextRequest) => {
    const token = extractBearerToken(request)
    return await verifyJwtToken(token)
  },
  
  // Layer 3: Resource authorization
  resourceAuthorization: (user: User, resource: Resource) => {
    return user.id === resource.userId
  },
  
  // Layer 4: Feature gating
  featureGating: (user: User, feature: string) => {
    const requiredTier = getFeatureRequiredTier(feature)
    return isUserTierSufficient(user.tier, requiredTier)
  }
}
```

### 2. Database Security (RLS)

```sql
-- Comprehensive RLS policies
-- 1. User data isolation
CREATE POLICY "users_own_data" ON temp_emails
  FOR ALL USING (user_id = auth.uid());

-- 2. Feature-based access control
CREATE POLICY "premium_features" ON temp_emails
  FOR INSERT WITH CHECK (
    -- Custom domains require premium tier
    CASE 
      WHEN domain NOT IN ('default.com', 'temp.org')
      THEN (
        SELECT tier FROM users 
        WHERE id = auth.uid() 
        AND tier IN ('quick', 'extended', 'pro')
      ) IS NOT NULL
      ELSE true
    END
  );

-- 3. Usage limits enforcement
CREATE POLICY "daily_limits" ON temp_emails
  FOR INSERT WITH CHECK (
    (SELECT COUNT(*) FROM temp_emails 
     WHERE user_id = auth.uid() 
     AND DATE(created_at) = CURRENT_DATE) < (
      SELECT daily_email_limit FROM user_tiers 
      WHERE tier = (SELECT tier FROM users WHERE id = auth.uid())
    )
  );
```

## Performance Optimizations

### 1. Database Optimizations

```sql
-- Strategic indexing for performance
CREATE INDEX CONCURRENTLY idx_temp_emails_user_active 
ON temp_emails(user_id, expires_at) 
WHERE expires_at > NOW();

CREATE INDEX CONCURRENTLY idx_email_messages_received 
ON email_messages(temp_email_id, received_at DESC);

CREATE INDEX CONCURRENTLY idx_daily_usage_user_date 
ON daily_usage(user_id, date);

-- Partitioning for large tables
CREATE TABLE email_messages_2025_01 PARTITION OF email_messages
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 2. Caching Strategy

```typescript
// Multi-level caching
export class CacheService {
  // Level 1: In-memory cache (Redis)
  async getUserProfile(userId: string): Promise<UserProfile> {
    const cacheKey = `user:${userId}`
    
    // Try cache first
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)
    
    // Fetch from database
    const profile = await this.userRepo.getUserProfile(userId)
    
    // Cache for 15 minutes
    await this.redis.setex(cacheKey, 900, JSON.stringify(profile))
    
    return profile
  }
  
  // Level 2: CDN caching for static assets
  // Level 3: Browser caching with proper headers
  setCacheHeaders(response: NextResponse, maxAge: number) {
    response.headers.set('Cache-Control', `public, max-age=${maxAge}`)
    response.headers.set('ETag', this.generateETag())
  }
}
```

### 3. Code Splitting & Lazy Loading

```typescript
// Strategic component lazy loading
const EmailDashboard = lazy(() => 
  import('@/components/dashboard/EmailDashboard')
)

const PricingModal = lazy(() => 
  import('@/components/pricing/PricingModal')
)

const AnalyticsDashboard = lazy(() => 
  import('@/components/admin/AnalyticsDashboard')
)

// Route-based code splitting with Next.js
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <EmailDashboard />
    </Suspense>
  )
}
```

## Scalability Considerations

### 1. Horizontal Scaling

```typescript
// Stateless design for horizontal scaling
export class EmailService {
  // No instance state - all state in database
  // Can be scaled horizontally without issues
  
  constructor(
    private readonly config: ServiceConfig,
    private readonly db: DatabaseClient,
    private readonly cache: CacheClient
  ) {}
}
```

### 2. Database Scaling

```sql
-- Read replicas for scaling reads
-- Connection pooling with PgBouncer
-- Table partitioning for large datasets
-- Indexes for query optimization
```

### 3. CDN Integration

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['cdn.tempemail.pro'],
    formats: ['image/webp', 'image/avif']
  },
  
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store' }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ]
  }
}
```

## Monitoring & Observability

### 1. Application Monitoring

```typescript
// lib/monitoring.ts
export class MonitoringService {
  async trackPerformance(operation: string, duration: number) {
    await this.metrics.histogram('operation_duration', duration, {
      operation,
      service: 'tempemail-pro'
    })
  }
  
  async trackError(error: Error, context: any) {
    await this.sentry.captureException(error, {
      tags: { service: 'tempemail-pro' },
      extra: context
    })
  }
  
  async trackBusinessMetric(metric: string, value: number, tags: any) {
    await this.metrics.gauge(`business.${metric}`, value, tags)
  }
}
```

### 2. Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkEmailProviders(),
    checkStripeAPI(),
    checkRedisCache()
  ])
  
  const results = checks.map((check, index) => ({
    service: ['database', 'email', 'stripe', 'cache'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    details: check.status === 'fulfilled' ? check.value : check.reason
  }))
  
  const isHealthy = results.every(r => r.status === 'healthy')
  
  return Response.json(
    { status: isHealthy ? 'healthy' : 'unhealthy', checks: results },
    { status: isHealthy ? 200 : 503 }
  )
}
```

---

**Architecture Version**: 1.1.1  
**Last Updated**: January 1, 2025  
**Architect**: Sayem Abdullah Rihan (Code-Craka)

## Recent Architecture Updates (v1.1.1)

### Code Quality Improvements
- **Type Safety Enhancement**: Improved TypeScript definitions throughout the service layer
- **Error Handling Standardization**: Consistent error patterns across all API routes
- **Performance Optimization**: Reduced bundle size through unused import elimination
- **Component Architecture**: Cleaner separation of concerns in React components

### Technical Debt Reduction
- **Import Optimization**: Removed 20+ unused lucide-react imports across components
- **React Performance**: Fixed useEffect dependencies with proper useCallback implementation
- **API Enhancement**: Improved parameter handling in email service and webhook routes
- **Bundle Size**: Eliminated duplicate PostCSS configuration and dead code

### Security & Reliability
- **Parameter Validation**: Enhanced request validation and sanitization
- **Type Definitions**: Better TypeScript support for Stripe webhooks and email providers
- **Error Boundaries**: Improved error handling with proper type safety
- **Code Consistency**: Standardized patterns across the entire codebase
