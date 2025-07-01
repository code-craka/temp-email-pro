# TempEmailPro - SaaS Platform

A high-revenue SaaS platform for temporary email services targeting $20,000+ monthly revenue through multiple monetization streams.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/code-craka/temp-email-pro)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.1-38B2AC.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

## 🎯 Overview

TempEmailPro is a modern temporary email service built with Next.js 15, featuring a freemium subscription model, premium domain access, and comprehensive revenue optimization. The platform targets privacy-conscious users and developers needing temporary email addresses for testing, privacy protection, and temporary registrations.

### ✨ Key Features

- 🎯 **4-Tier Freemium Model** - From free to pro ($0-$9.99/month)
- 🔐 **Premium Custom Domains** - Professional email addresses by tier
- 📊 **Real-time Analytics** - Usage tracking and conversion optimization
- 💳 **Stripe Integration** - Seamless subscription management
- 🛡️ **Enterprise Security** - Row Level Security (RLS) and server-side auth
- 🔄 **99.9% Uptime** - Multi-provider email service with fallback
- 📱 **Modern Glassmorphism UI** - Tailwind CSS v4.1 with OKLCH color space
- 🚀 **Developer API** - RESTful API for integration and automation
- ⚡ **Real-time Dashboard** - Live updates, timers, and conversion prompts
- 🎨 **CSS-First Design** - No Tailwind config needed, pure CSS approach
- 📱 **Mobile-First Responsive** - Container queries and touch-optimized UI

## 🏗️ Project Structure

```
temp-email-pro/
├── 📁 app/                      # Next.js 15 App Router
│   ├── 📁 (auth)/               # Authentication pages
│   ├── 📁 api/                  # API routes & endpoints
│   ├── 📁 dashboard/            # User dashboard
│   └── 📁 pricing/              # Pricing & billing
├── 📁 components/               # React components
│   ├── 📁 ui/                   # Base UI components (LoadingSpinner, etc.)
│   ├── 📁 email/                # Email management components
│   ├── 📁 dashboard/            # Dashboard widgets & sections
│   └── 📁 conversion/           # Smart conversion prompts
├── 📁 types/                    # TypeScript type definitions
│   └── 📄 dashboard.ts          # Dashboard interfaces & types
├── 📁 lib/                      # Core business logic
│   ├── 📄 auth.ts               # Supabase SSR authentication
│   ├── 📄 email-service.ts      # Email provider logic
│   └── 📄 database-schema.sql   # Complete database schema
├── 📁 docs/                     # Comprehensive documentation
│   ├── 📁 api/                  # API documentation
│   ├── 📁 deployment/           # Deployment guides
│   ├── 📁 development/          # Development workflow
│   ├── 📁 architecture/         # System architecture
│   └── 📁 business/             # Business model & strategy
├── 📄 CHANGELOG.md              # Release history
├── 📄 LICENSE                   # MIT License
└── 📄 VERSION_CONTROL.md        # Git workflow & versioning
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **pnpm** 8.0.0+ (recommended package manager)
- **Supabase** account (database & authentication)
- **Stripe** account (payments & subscriptions)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/code-craka/temp-email-pro.git
cd temp-email-pro

# 2. Install dependencies with pnpm
pnpm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 4. Set up the database
# Go to Supabase → SQL Editor → Run lib/database-schema.sql

# 5. Start development server
pnpm dev
```

### Environment Configuration

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Email Provider APIs
MAIL_TM_API_TOKEN=your-mail-tm-token
TEMPMAIL_LOL_API_KEY=your-tempmail-key

# Stripe Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-secret
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

## 💰 Business Model

### Subscription Tiers

| Tier | Price | Daily Emails | Retention | Key Features |
|------|-------|--------------|-----------|--------------|
| **Free** | $0/month | 5 emails | 1 hour | Basic temporary emails |
| **Quick** | $0.99/month | 25 emails | 24 hours | Custom domains (techsci.dev, techsci.xyz) |
| **Extended** | $2.99/month | 100 emails | 1 week | Email forwarding, negoman.com domain |
| **Pro** | $9.99/month | 500 emails | 30 days | API access, techsci.tech, bulk creation |

### Revenue Streams

1. **💎 Freemium Subscriptions** - Core tier system with 14-day trials
2. **🔌 API Monetization** - Developer API ($29-$299/month)  
3. **🏷️ White-label Licensing** - Platform licensing ($299-$999/month)
4. **🤝 Affiliate Program** - 30% commission on referrals

**Target Metrics:**

- 📈 **Conversion Rate**: 15% (Free → Paid)
- 🔄 **Monthly Churn**: <5%
- 💵 **Customer LTV**: $50+ average
- 🎯 **Monthly Revenue**: $20,000+ target

## 🛠️ Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router & Turbopack
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS v4.1** - Modern CSS-first approach with OKLCH color space
- **Glassmorphism Design** - Modern UI with backdrop blur effects
- **Container Queries** - Advanced responsive design capabilities
- **Lucide React** - Beautiful icon library for consistent UI

### Backend

- **Next.js API Routes** - Server-side API endpoints
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - Server-side rendering authentication
- **Stripe** - Payment processing and subscription management

### Database

- **PostgreSQL** - Primary database via Supabase
- **Row Level Security (RLS)** - Database-level security policies
- **Real-time Subscriptions** - Live data updates
- **Optimized Indexes** - Performance-tuned queries

### Infrastructure

- **Vercel** - Hosting and deployment platform
- **pnpm** - Fast, efficient package manager
- **Multi-provider Email APIs** - Fallback system for reliability

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

### 📖 Core Documentation

- **[API Reference](./docs/api/README.md)** - Complete API documentation
- **[Development Guide](./docs/development/README.md)** - Development workflow & standards
- **[Deployment Guide](./docs/deployment/README.md)** - Production deployment instructions
- **[Architecture Overview](./docs/architecture/README.md)** - System architecture & design patterns
- **[Business Documentation](./docs/business/README.md)** - Business model & revenue strategy

### 📋 Project Management

- **[CHANGELOG.md](./CHANGELOG.md)** - Release history and version notes
- **[VERSION_CONTROL.md](./docs/VERSION_CONTROL.md)** - Git workflow and versioning strategy
- **[LICENSE](./LICENSE)** - MIT License terms

## 🚀 Deployment

### Production Deployment (Vercel)

```bash
# Build for production
pnpm build

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
# Set up Stripe webhooks pointing to your domain
```

### Database Setup

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the complete schema from `lib/database-schema.sql`
4. Verify RLS policies are active

### Environment Variables

Ensure all production environment variables are configured:

- Supabase URLs and keys
- Stripe live API keys  
- Email provider API tokens
- Webhook secrets

## 📊 Performance & Security

### Performance Features

- ⚡ **Turbopack** - Ultra-fast development builds
- 🗜️ **Code Splitting** - Optimized bundle sizes
- 🖼️ **Image Optimization** - Next.js automatic optimization
- 📦 **Modern CSS** - Tailwind CSS v4.1 performance improvements

### Security Features

- 🔒 **Row Level Security** - Database-level access control
- 🛡️ **Server-side Auth** - Supabase SSR authentication
- 🔑 **API Key Protection** - Environment-based configuration
- 📋 **Usage Limits** - Prevents abuse and ensures fair usage
- 🚨 **Premium Gating** - Server-side feature validation

## 🧪 Testing & Quality

### Development Commands

```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint code quality checks

# Package Management
pnpm install          # Install all dependencies
pnpm add <package>    # Add new package
pnpm remove <package> # Remove package
```

### Code Quality

- **ESLint** - Code linting and style enforcement
- **TypeScript** - Static type checking
- **Prettier** - Code formatting (via VS Code)
- **Conventional Commits** - Standardized commit messages

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](./docs/development/README.md) for detailed instructions.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper commit messages
4. Push to your branch: `git push origin feature/amazing-feature`
5. Create a Pull Request

### Commit Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(email): add custom domain validation
fix(auth): resolve login redirect issue  
docs(api): update email generation endpoint
```

## 👨‍💻 Author & Team

**Sayem Abdullah Rihan** (aka **Code-Craka**)

- 🌟 **Role**: Creator & Lead Developer
- 🐙 **GitHub**: [@code-craka](https://github.com/code-craka)
- 🏢 **Company**: Independent SaaS Developer

### Project Stats

- 📅 **Started**: January 2025
- 🚀 **Version**: 1.0.0 (Foundation Release)
- 📈 **Status**: Production Ready (Phase 1 Complete)
- 🎯 **Next Milestone**: Stripe Integration (v1.1.0)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

```
MIT License - Copyright (c) 2025 Sayem Abdullah Rihan (Code-Craka)
Permission is hereby granted, free of charge, to any person obtaining a copy...
```

## 📞 Support & Contact

### Getting Help

- 📖 **Documentation**: Check the `/docs` folder for comprehensive guides
- 🐛 **Issues**: [GitHub Issues](https://github.com/code-craka/temp-email-pro/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/code-craka/temp-email-pro/discussions)

### Business Inquiries

- 📧 **Email**: Contact through GitHub profile
- 🌐 **Website**: [GitHub Repository](https://github.com/code-craka/temp-email-pro)
- 💼 **Partnerships**: Open to collaboration and licensing opportunities

---

<div align="center">

**🚀 Built with ❤️ by [Sayem Abdullah Rihan (Code-Craka)](https://github.com/code-craka)**

*Empowering privacy and productivity through innovative temporary email solutions*

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)

</div>