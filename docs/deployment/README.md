# Deployment Guide

This guide covers deploying TempEmailPro to production environments, including Vercel, custom servers, and container orchestration.

## Prerequisites

- Node.js 18+ 
- pnpm package manager
- Supabase project (database + auth)
- Stripe account (payments)
- Email provider API keys (Mail.tm, TempMail.lol)

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email Providers
MAIL_TM_BASE_URL=https://api.mail.tm
MAIL_TM_API_TOKEN=your-production-token
TEMPMAIL_LOL_BASE_URL=https://api.tempmail.lol
TEMPMAIL_LOL_API_KEY=your-production-key

# Stripe Configuration (Live Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Application Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
NODE_ENV=production

# Optional: Analytics & Monitoring
NEXT_PUBLIC_LOGROCKET_APP_ID=your-logrocket-id
SENTRY_DSN=your-sentry-dsn
```

## Vercel Deployment (Recommended)

Vercel provides the easiest deployment option with automatic scaling and edge optimization.

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Project Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "cd temp-email-pro && pnpm build",
  "outputDirectory": "temp-email-pro/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "fra1"],
  "env": {
    "PNPM_FLAGS": "--shamefully-hoist"
  },
  "functions": {
    "temp-email-pro/app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/temp-email-pro/app/api/$1"
    }
  ]
}
```

### 3. Deploy to Vercel

```bash
# Initial deployment
cd temp-email-pro
vercel

# Production deployment
vercel --prod
```

### 4. Configure Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all production environment variables
3. Set different values for Preview and Production

### 5. Custom Domain Setup

```bash
# Add custom domain
vercel domains add your-domain.com
vercel domains add www.your-domain.com

# Configure DNS
# Add CNAME: your-domain.com → cname.vercel-dns.com
```

## Docker Deployment

For containerized deployments on custom infrastructure.

### 1. Create Dockerfile

```dockerfile
# temp-email-pro/Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Build
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  tempemail-pro:
    build:
      context: ./temp-email-pro
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    env_file:
      - .env.production
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - tempemail-pro
    restart: unless-stopped
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f tempemail-pro

# Scale application
docker-compose up -d --scale tempemail-pro=3
```

## Database Setup

### 1. Supabase Configuration

Run the database schema in Supabase SQL Editor:

```sql
-- Copy contents from lib/database-schema.sql
-- This creates all tables, indexes, and RLS policies
```

### 2. Database Migrations

For future schema updates:

```bash
# Create migration file
mkdir -p migrations
cat > migrations/002_add_email_forwarding.sql << EOF
-- Add email forwarding feature
ALTER TABLE temp_emails ADD COLUMN forward_to VARCHAR(255);
CREATE INDEX idx_temp_emails_forward_to ON temp_emails(forward_to);
EOF

# Apply migration in Supabase SQL Editor
```

### 3. Row Level Security (RLS)

Verify RLS policies are active:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should return true for all tables
```

## Load Balancer Configuration

### Nginx Configuration

```nginx
# nginx.conf
upstream tempemail_backend {
    server tempemail-pro:3000;
    # Add more servers for scaling
    # server tempemail-pro-2:3000;
    # server tempemail-pro-3:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://tempemail_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static file caching
    location /_next/static/ {
        proxy_pass http://tempemail_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Monitoring & Health Checks

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    emailProviders: await checkEmailProviders(),
    stripe: await checkStripe(),
    timestamp: new Date().toISOString()
  }
  
  const isHealthy = Object.values(checks).every(check => 
    typeof check === 'boolean' ? check : check.status === 'healthy'
  )
  
  return Response.json(checks, { 
    status: isHealthy ? 200 : 503 
  })
}
```

### Docker Health Check

```dockerfile
# Add to Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Performance Optimization

### CDN Configuration

```javascript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-cdn.com'],
    loader: 'custom',
    loaderFile: './imageLoader.js'
  },
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

### Database Connection Pooling

```javascript
// lib/database.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

## Backup Strategy

### Database Backups

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backups/tempemail_$DATE.sql
aws s3 cp backups/tempemail_$DATE.sql s3://your-backup-bucket/

# Cleanup old backups (keep 30 days)
find backups/ -name "*.sql" -mtime +30 -delete
```

### Application Backups

```bash
# Backup user uploads and generated files
tar -czf app_backup_$DATE.tar.gz public/uploads temp-data/
aws s3 cp app_backup_$DATE.tar.gz s3://your-backup-bucket/app/
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear build cache
   rm -rf .next node_modules
   pnpm install
   pnpm build
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connectivity
   psql $DATABASE_URL -c "SELECT version();"
   ```

3. **Environment Variable Issues**
   ```bash
   # Verify environment variables
   node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
   ```

### Logging

```javascript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})
```

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables properly configured
- [ ] Database RLS policies active
- [ ] API rate limiting configured
- [ ] Security headers implemented
- [ ] Regular security updates scheduled
- [ ] Backup strategy tested
- [ ] Monitoring and alerting configured

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: January 1, 2025  
**Maintained by**: Sayem Abdullah Rihan (Code-Craka)