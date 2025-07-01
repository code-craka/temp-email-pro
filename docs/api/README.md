# API Documentation

TempEmailPro provides a comprehensive REST API for temporary email management, user authentication, and subscription handling.

## Base URL

```http
https://your-domain.com/api
```

## API Endpoints

### Email Generation

```http
POST /api/emails
```

## Authentication

All API endpoints require authentication via Supabase session cookies or API keys.

### Headers

```http
Content-Type: application/json
Authorization: Bearer <supabase-jwt-token>
```

## Email Management

### Generate Temporary Email

Create a new temporary email address based on user's subscription tier.

```http
POST /api/emails
```

**Request Body:**

```json
{
  "customDomain": "techsci.dev",  // Optional, requires premium tier
  "username": "custom-name"       // Optional, auto-generated if not provided
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "temp_email_123",
    "email": "custom-name@techsci.dev",
    "expiresAt": "2025-01-02T00:00:00Z",
    "tier": "quick",
    "messagesReceived": 0
  }
}
```

**Error Responses:**

```json
{
  "error": "Premium feature required",
  "message": "Custom domains require Quick tier or higher",
  "upgradeUrl": "/pricing"
}
```

### List User Emails

Retrieve all temporary emails for the authenticated user.

```http
GET /api/emails
```

**Query Parameters:**

- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `active` (optional): Filter active emails only (default: true)

**Response:**

```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "temp_email_123",
        "email": "user@techsci.dev",
        "createdAt": "2025-01-01T12:00:00Z",
        "expiresAt": "2025-01-02T12:00:00Z",
        "messagesCount": 3,
        "isActive": true
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 50,
      "offset": 0
    }
  }
}
```

### Get Email Messages

Retrieve messages for a specific temporary email.

```http
GET /api/emails/{emailId}/messages
```

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_456",
        "from": "sender@example.com",
        "subject": "Welcome to our service",
        "bodyText": "Thank you for signing up...",
        "bodyHtml": "<p>Thank you for signing up...</p>",
        "receivedAt": "2025-01-01T13:30:00Z",
        "attachments": []
      }
    ]
  }
}
```

## Usage Tracking

### Get User Usage

Retrieve current usage statistics for the authenticated user.

```http
GET /api/usage
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "currentTier": "quick",
    "dailyUsage": {
      "emailsGenerated": 8,
      "limit": 25,
      "resetAt": "2025-01-02T00:00:00Z"
    },
    "trialStatus": {
      "isActive": true,
      "daysRemaining": 12,
      "features": ["Custom domains", "24-hour retention", "Priority support"]
    },
    "subscription": {
      "status": "trial",
      "expiresAt": "2025-01-14T00:00:00Z",
      "autoRenew": false
    }
  }
}
```

### Update Usage

Track email generation usage (internal API).

```http
POST /api/usage
```

**Request Body:**

```json
{
  "action": "email_generated",
  "emailId": "temp_email_123",
  "metadata": {
    "domain": "techsci.dev",
    "tier": "quick"
  }
}
```

## Stripe Integration

### Create Checkout Session

Create a Stripe checkout session for subscription upgrade.

```http
POST /api/stripe/checkout
```

**Request Body:**

```json
{
  "tier": "quick",           // quick, extended, or pro
  "successUrl": "/dashboard?success=true",
  "cancelUrl": "/pricing?cancelled=true"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_123...",
    "url": "https://checkout.stripe.com/pay/cs_test_123..."
  }
}
```

### Stripe Webhooks

Handle Stripe webhook events for subscription lifecycle.

```http
POST /api/stripe/webhooks
```

**Supported Events:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication
- `PREMIUM_REQUIRED` (402): Feature requires paid subscription
- `USAGE_LIMIT_EXCEEDED` (429): Daily usage limit reached
- `INVALID_REQUEST` (400): Malformed request body
- `NOT_FOUND` (404): Resource not found
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Email Generation**: 1 request per 5 seconds
- **Other Endpoints**: 100 requests per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1641024000
```

## SDKs and Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'your-supabase-url',
  'your-supabase-anon-key'
)

// Generate email
const { data, error } = await supabase.functions.invoke('generate-email', {
  body: { customDomain: 'techsci.dev' }
})
```

### cURL Examples

```bash
# Generate email
curl -X POST https://your-domain.com/api/emails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"customDomain": "techsci.dev"}'

# Get usage
curl -X GET https://your-domain.com/api/usage \
  -H "Authorization: Bearer <token>"
```

## Webhook Endpoints

### Email Received Webhook

Subscribe to real-time email notifications:

```http
POST /api/webhooks/email-received
```

**Payload:**

```json
{
  "emailId": "temp_email_123",
  "messageId": "msg_456",
  "from": "sender@example.com",
  "subject": "New message",
  "receivedAt": "2025-01-01T14:00:00Z"
}
```

## Testing

### Development Environment

Use the following test data in development:

```json
{
  "testUser": {
    "email": "test@example.com",
    "tier": "quick",
    "trialActive": true
  },
  "testDomains": ["test.dev", "example.xyz"]
}
```

### API Testing Tools

- **Postman Collection**: Available in `/docs/api/postman-collection.json`
- **OpenAPI Spec**: Available in `/docs/api/openapi.yaml`
- **Test Scripts**: Located in `/tests/api/`

---

**Version**: 1.1.1  
**Last Updated**: January 1, 2025  
**Maintained by**: Sayem Abdullah Rihan (Code-Craka)

## Recent Updates (v1.1.1)

### API Improvements
- **Enhanced Type Safety**: Improved TypeScript definitions for all API endpoints
- **Error Handling**: Standardized error response patterns across all routes
- **Performance Optimization**: Reduced response times through code optimization
- **Security Enhancement**: Improved parameter validation and sanitization

### Code Quality Updates
- **Import Optimization**: Reduced bundle size through unused import removal
- **Better Documentation**: Enhanced inline code documentation and JSDoc comments
- **Consistent Patterns**: Standardized request/response handling across endpoints
- **Webhook Reliability**: Improved Stripe webhook handling with proper type definitions