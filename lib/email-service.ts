export interface EmailProvider {
  name: string;
  generateEmail(domain?: string): Promise<string>;
  getMessages(email: string): Promise<Message[]>;
  isHealthy(): Promise<boolean>;
  supportCustomDomains: boolean;
}

export interface Message {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  filename: string;
  size: number;
  contentType: string;
  downloadUrl: string;
}

// Mail.tm Provider Implementation
export class MailTmProvider implements EmailProvider {
  name = 'Mail.tm';
  supportCustomDomains = true;
  private baseUrl = 'https://api.mail.tm';
  private token: string | null = null;

  async generateEmail(customDomain?: string): Promise<string> {
    try {
      // Get available domains
      const domainsResponse = await fetch(`${this.baseUrl}/domains`);
      const domains = await domainsResponse.json();
      
      // Use custom domain if provided and user has premium
      const domain = customDomain || domains[0]?.domain;
      
      if (!domain) {
        throw new Error('No domains available');
      }

      // Generate random username
      const username = this.generateUsername();
      const email = `${username}@${domain}`;
      
      // Create account
      const accountResponse = await fetch(`${this.baseUrl}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: email,
          password: this.generatePassword()
        })
      });

      if (!accountResponse.ok) {
        throw new Error('Failed to create email account');
      }

      const account = await accountResponse.json();
      
      // Get auth token
      const authResponse = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: email,
          password: account.password
        })
      });

      const auth = await authResponse.json();
      this.token = auth.token;

      return email;
    } catch (error) {
      console.error('Mail.tm generation failed:', error);
      throw error;
    }
  }

  async getMessages(_email: string): Promise<Message[]> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      
      return data.map((msg: any) => ({
        id: msg.id,
        from: msg.from.address,
        subject: msg.subject,
        body: msg.text || msg.html,
        receivedAt: new Date(msg.createdAt),
        attachments: msg.attachments?.map((att: any) => ({
          filename: att.filename,
          size: att.size,
          contentType: att.contentType,
          downloadUrl: `${this.baseUrl}/messages/${msg.id}/attachment/${att.id}`
        })) || []
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/domains`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private generateUsername(): string {
    const adjectives = ['quick', 'smart', 'cool', 'fast', 'pro', 'tech', 'dev'];
    const nouns = ['user', 'mail', 'temp', 'test', 'demo', 'ninja', 'guru'];
    const numbers = Math.floor(Math.random() * 9999);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}${noun}${numbers}`;
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(-12);
  }
}

// TempMail.lol Provider Implementation
export class TempMailProvider implements EmailProvider {
  name = 'TempMail.lol';
  supportCustomDomains = false;
  private baseUrl = 'https://api.tempmail.lol';

  async generateEmail(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`);
      const data = await response.json();
      
      if (!data.email) {
        throw new Error('Failed to generate email');
      }
      
      return data.email;
    } catch (error) {
      console.error('TempMail.lol generation failed:', error);
      throw error;
    }
  }

  async getMessages(_email: string): Promise<Message[]> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/${_email}`);
      const data = await response.json();
      
      if (!data.email) {
        return [];
      }

      return data.email.map((msg: any) => ({
        id: msg.id,
        from: msg.from,
        subject: msg.subject,
        body: msg.body,
        receivedAt: new Date(msg.date),
        attachments: []
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Premium Domain Configuration
export const PREMIUM_DOMAINS = {
  'techsci.dev': {
    name: 'TechSci Dev',
    description: 'Perfect for developers and tech professionals',
    tier: 'quick',
    category: 'tech'
  },
  'techsci.xyz': {
    name: 'TechSci XYZ',
    description: 'Modern domain for tech innovators',
    tier: 'quick',
    category: 'tech'
  },
  'negoman.com': {
    name: 'Negoman',
    description: 'Professional business communications',
    tier: 'extended',
    category: 'business'
  },
  'techsci.tech': {
    name: 'TechSci Tech',
    description: 'Premium tech domain for professionals',
    tier: 'pro',
    category: 'premium'
  }
} as const;

// Main Email Service with Fallback System
export class EmailService {
  private providers: EmailProvider[] = [
    new MailTmProvider(),
    new TempMailProvider()
  ];

  async generateEmail(user: Record<string, any>, options?: {
    customDomain?: string;
    retentionHours?: number;
  }): Promise<{ email: string; expiresAt: Date; provider: string }> {
    // Check user limits
    const limits = this.getUserLimits(user.subscription_tier);
    const todayCount = await this.getTodayEmailCount(user.id);
    
    if (todayCount >= limits.emailsPerDay) {
      throw new PremiumFeatureRequired(
        `Daily limit of ${limits.emailsPerDay} emails reached. Upgrade to generate more emails.`,
        '/pricing'
      );
    }

    // Validate custom domain access
    if (options?.customDomain && !limits.customDomains) {
      throw new PremiumFeatureRequired(
        'Custom domains require a premium subscription.',
        '/pricing'
      );
    }

    // Validate domain tier access
    if (options?.customDomain) {
      const domainConfig = PREMIUM_DOMAINS[options.customDomain];
      if (domainConfig && !this.canAccessDomain(user.subscription_tier, domainConfig.tier)) {
        throw new PremiumFeatureRequired(
          `Domain ${options.customDomain} requires ${domainConfig.tier} plan or higher.`,
          '/pricing'
        );
      }
    }

    // Try providers with fallback
    for (const provider of this.providers) {
      try {
        if (await provider.isHealthy()) {
          const email = await provider.generateEmail(
            options?.customDomain && provider.supportCustomDomains 
              ? options.customDomain 
              : undefined
          );
          
          // Calculate retention based on subscription
          const retentionHours = Math.min(
            options?.retentionHours || limits.retentionHours,
            limits.retentionHours
          );
          
          const expiresAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000);

          // Save to database
          await this.saveGeneratedEmail(user.id, email, expiresAt, {
            provider: provider.name,
            customDomain: options?.customDomain,
            retentionHours
          });

          // Track usage for analytics
          await this.trackUsage(user.id, 'email_generated', {
            provider: provider.name,
            customDomain: !!options?.customDomain,
            retentionHours,
            tier: user.subscription_tier
          });

          return { 
            email, 
            expiresAt, 
            provider: provider.name 
          };
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }

    throw new Error('All email providers are currently unavailable. Please try again in a few minutes.');
  }

  async getMessages(_email: string): Promise<Message[]> {
    // Find which provider was used for this email
    const emailRecord = await this.getEmailRecord(_email);
    if (!emailRecord) {
      throw new Error('Email not found');
    }

    const provider = this.providers.find(p => p.name === emailRecord.provider);
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      return await provider.getMessages(_email);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  private getUserLimits(tier: string) {
    const limits = {
      free: { emailsPerDay: 5, retentionHours: 1, customDomains: false },
      quick: { emailsPerDay: 25, retentionHours: 24, customDomains: true },
      extended: { emailsPerDay: 100, retentionHours: 168, customDomains: true },
      pro: { emailsPerDay: 500, retentionHours: 720, customDomains: true }
    };
    
    return limits[tier] || limits.free;
  }

  private canAccessDomain(userTier: string, requiredTier: string): boolean {
    const tierOrder = ['free', 'quick', 'extended', 'pro'];
    const userIndex = tierOrder.indexOf(userTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return userIndex >= requiredIndex;
  }

  private async getTodayEmailCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // TODO: Replace with actual Supabase client
    console.log("Checking email count for user", userId);
    return 0;
  }

  private async saveGeneratedEmail(
    userId: string, 
    email: string, 
    expiresAt: Date, 
    metadata: any
  ): Promise<void> {
    // TODO: Replace with actual Supabase client
    console.log("Saving email to DB:", { userId, email, expiresAt, metadata });
  }

  private async getEmailRecord(email: string) {
    // TODO: Replace with actual Supabase client
    console.log("Getting email record for", email);
    return { provider: 'Mail.tm' };
  }

  private async trackUsage(userId: string, action: string, metadata: any): Promise<void> {
    // TODO: Replace with actual Supabase client
    console.log("Tracking usage:", { userId, action, metadata });
  }
}

export class PremiumFeatureRequired extends Error {
  constructor(
    message: string, 
    public upgradeUrl = '/pricing',
    public requiredTier?: string
  ) {
    super(message);
    this.name = 'PremiumFeatureRequired';
  }
}

// Simple function for API usage
export async function generateEmail(
  userProfile: any, 
  options?: { customDomain?: string }
): Promise<string> {
  const service = new EmailService();
  const result = await service.generateEmail(userProfile, options);
  return result.email;
}