# Development Guide

This guide covers the development workflow, coding standards, and best practices for contributing to TempEmailPro.

## Recent Updates (v1.1.1)

### Code Quality Improvements
- **Linting Standards**: Enhanced ESLint configuration and TypeScript strict mode
- **Import Optimization**: Automated removal of unused imports and dead code
- **Type Safety**: Improved TypeScript definitions and eliminated `any` types
- **Performance**: Optimized React components with proper hook dependencies

### Development Tools
- **Better IntelliSense**: Improved IDE support with proper TypeScript definitions
- **Faster Builds**: Reduced bundle size through import optimization
- **Consistent Patterns**: Standardized code patterns across the entire codebase
- **Error Handling**: Enhanced error boundaries and validation

## Development Environment Setup

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher (recommended over npm/yarn)
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions

### Required VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/code-craka/temp-email-pro.git
cd temp-email-pro

# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local

# Edit environment variables
nano .env.local
```

### Environment Variables for Development

```bash
# Supabase (Development)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Providers (Test Keys)
MAIL_TM_API_TOKEN=your-test-token
TEMPMAIL_LOL_API_KEY=your-test-key

# Stripe (Test Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Development
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

## Project Structure

```
temp-email-pro/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Registration page
│   ├── api/                      # API routes
│   │   ├── emails/route.ts       # Email generation API
│   │   ├── stripe/               # Stripe integration
│   │   └── usage/route.ts        # Usage tracking API
│   ├── dashboard/                # Dashboard pages
│   ├── globals.css               # Global styles (Tailwind v4.1)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── email/                    # Email-related components
│   ├── dashboard/                # Dashboard components
│   └── pricing/                  # Pricing components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Supabase SSR auth
│   ├── database.types.ts         # TypeScript types
│   ├── email-service.ts          # Email provider logic
│   ├── stripe.ts                 # Stripe integration
│   └── utils.ts                  # General utilities
├── hooks/                        # Custom React hooks
├── middleware.ts                 # Next.js middleware
├── public/                       # Static assets
└── docs/                         # Documentation
```

## Development Workflow

### Starting Development Server

```bash
# Start with Turbopack (faster)
pnpm dev

# Alternative: Start without Turbopack
pnpm dev --turbo=false

# With specific port
pnpm dev --port 3001
```

### Code Quality Tools

```bash
# Linting
pnpm lint                    # Check for issues
pnpm lint --fix             # Auto-fix issues

# Type checking
pnpm type-check             # Check TypeScript types

# Formatting (if Prettier is configured)
pnpm format                 # Format all files
```

## Coding Standards

### TypeScript Guidelines

#### Type Definitions

```typescript
// Use interfaces for objects
interface UserProfile {
  id: string
  email: string
  tier: SubscriptionTier
  createdAt: Date
}

// Use types for unions and primitives
type SubscriptionTier = 'free' | 'quick' | 'extended' | 'pro'
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}
```

#### Error Handling

```typescript
// Custom error classes
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

// API error responses
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    { error, details },
    { status }
  )
}
```

### React Component Guidelines

#### Component Structure

```typescript
// components/email/EmailGenerator.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface EmailGeneratorProps {
  userTier: SubscriptionTier
  onEmailGenerated?: (email: string) => void
}

export function EmailGenerator({
  userTier,
  onEmailGenerated
}: EmailGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuth()

  // Component logic here

  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  )
}
```

#### Hooks Guidelines

```typescript
// hooks/useEmailGeneration.ts
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/auth'

export function useEmailGeneration() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateEmail = useCallback(async (options: GenerateEmailOptions) => {
    setIsLoading(true)
    setError(null)

    try {
      // Generation logic
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { generateEmail, isLoading, error }
}
```

### CSS and Styling

#### Tailwind CSS v4.1 Usage

```typescript
// Using CSS variables defined in @theme
const cardStyles = cn(
  "bg-card text-card-foreground",
  "border border-border rounded-lg",
  "p-6 shadow-sm"
)

// Dynamic spacing with calc()
const dynamicSpacing = "p-[calc(var(--spacing)*6)]" // p-6 equivalent

// Modern color usage with OKLCH
const colorStyles = "bg-[oklch(96%_0_0)] text-[oklch(9%_0_0)]"
```

#### Component Styling Patterns

```typescript
// Use clsx for conditional classes
import { clsx } from 'clsx'

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground"
  },
  size: {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-11 px-8"
  }
}

export function Button({ variant = 'default', size = 'md', className, ...props }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center",
        "rounded-md font-medium transition-colors",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      {...props}
    />
  )
}
```

## API Development

### Route Handler Structure

```typescript
// app/api/emails/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth'
import { z } from 'zod'

// Request validation schema
const generateEmailSchema = z.object({
  customDomain: z.string().optional(),
  username: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Request validation
    const body = await request.json()
    const validatedData = generateEmailSchema.parse(body)

    // Business logic
    const result = await generateTempEmail(user.id, validatedData)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Email generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof PremiumFeatureRequired) {
      return NextResponse.json(
        { 
          error: 'Premium feature required',
          message: error.message,
          upgradeUrl: error.upgradeUrl
        },
        { status: 402 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Database Operations

```typescript
// lib/database-operations.ts
import { createClient } from '@/lib/auth'

export async function getUserUsage(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', new Date().toISOString().split('T')[0])
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Database error: ${error.message}`)
  }

  return data
}

export async function incrementEmailUsage(userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('increment_email_usage', {
    p_user_id: userId
  })

  if (error) {
    throw new Error(`Failed to increment usage: ${error.message}`)
  }
}
```

## Testing Strategy

### Unit Testing with Jest

```typescript
// __tests__/lib/email-service.test.ts
import { generateTempEmail } from '@/lib/email-service'
import { PremiumFeatureRequired } from '@/lib/errors'

describe('Email Service', () => {
  it('should generate email for free tier', async () => {
    const result = await generateTempEmail('user123', {
      tier: 'free'
    })

    expect(result.email).toMatch(/@[a-zA-Z0-9.-]+\.(com|net|org)$/)
    expect(result.expiresAt).toBeInstanceOf(Date)
  })

  it('should throw error for custom domain on free tier', async () => {
    await expect(generateTempEmail('user123', {
      tier: 'free',
      customDomain: 'techsci.dev'
    })).rejects.toThrow(PremiumFeatureRequired)
  })
})
```

### Integration Testing

```typescript
// __tests__/api/emails.test.ts
import { POST } from '@/app/api/emails/route'
import { NextRequest } from 'next/server'

describe('/api/emails', () => {
  it('should generate email for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        customDomain: 'techsci.dev'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.email).toBeDefined()
  })
})
```

## Database Development

### Schema Changes

```sql
-- migrations/003_add_email_forwarding.sql
-- Migration: Add email forwarding feature

-- Add forwarding column to temp_emails
ALTER TABLE temp_emails 
ADD COLUMN forward_to VARCHAR(255),
ADD COLUMN forwarding_enabled BOOLEAN DEFAULT false;

-- Create index for forwarding queries
CREATE INDEX idx_temp_emails_forwarding 
ON temp_emails(forward_to, forwarding_enabled) 
WHERE forwarding_enabled = true;

-- Update RLS policy to include forwarding
DROP POLICY IF EXISTS "temp_emails_user_access" ON temp_emails;
CREATE POLICY "temp_emails_user_access" ON temp_emails
  FOR ALL USING (user_id = auth.uid());

-- Add forwarding limits to usage tracking
INSERT INTO user_limits (feature, tier, daily_limit) VALUES
  ('email_forwarding', 'extended', 50),
  ('email_forwarding', 'pro', 200);
```

### Local Database Setup

```bash
# Start local Supabase (if using local development)
npx supabase start

# Apply migrations
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > lib/database.types.ts
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy loading components
import { lazy, Suspense } from 'react'

const EmailDashboard = lazy(() => import('@/components/dashboard/EmailDashboard'))
const PricingModal = lazy(() => import('@/components/pricing/PricingModal'))

export function Dashboard() {
  return (
    <div>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <EmailDashboard />
      </Suspense>
    </div>
  )
}
```

### Image Optimization

```typescript
// components/ui/OptimizedImage.tsx
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export function OptimizedImage({ src, alt, width, height, priority = false }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={85}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    />
  )
}
```

## Debugging

### Development Tools

```typescript
// lib/debug.ts
export const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🐛 ${message}`, data)
  }
}

export const debugTimer = (label: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.time(label)
    return () => console.timeEnd(label)
  }
  return () => {}
}
```

### Error Boundary

```typescript
// components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Git Workflow for Development

### Feature Development

```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/email-forwarding

# Development work
git add .
git commit -m "feat: implement email forwarding for premium users"

# Push and create PR
git push origin feature/email-forwarding
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(email): add custom domain validation
fix(auth): resolve login redirect issue
docs(api): update email generation endpoint
refactor(components): extract reusable button component
test(email): add unit tests for email service
```

---

**Development Guide Version**: 1.0.0  
**Last Updated**: January 1, 2025  
**Maintained by**: Sayem Abdullah Rihan (Code-Craka)