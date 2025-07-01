
export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  features: string[];
  hasUsedTrial: boolean;
  startedAt?: Date;
  expiresAt?: Date;
}

export class TrialService {
  private readonly TRIAL_DURATION_DAYS = 14;
  
  async startTrial(userId: string): Promise<TrialStatus> {
    // Check if user has already used trial
    const existingTrial = await this.getTrialStatus(userId);
    if (existingTrial.hasUsedTrial) {
      throw new Error('Trial already used. Upgrade to continue using premium features.');
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + this.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    // Save trial start to database
    // TODO: Replace with actual Supabase client
    console.log("Starting trial for user", userId);

    // Track trial start for analytics
    await this.trackTrialEvent(userId, 'trial_started', {
      trialLength: this.TRIAL_DURATION_DAYS,
      startDate: startDate.toISOString()
    });

    return {
      isActive: true,
      daysRemaining: this.TRIAL_DURATION_DAYS,
      features: this.getTrialFeatures(),
      hasUsedTrial: true,
      startedAt: startDate,
      expiresAt: endDate
    };
  }

  async getTrialStatus(userId: string): Promise<TrialStatus> {
    // TODO: Replace with actual Supabase client
    console.log("Getting trial status for user", userId);
    return {
        isActive: false,
        daysRemaining: this.TRIAL_DURATION_DAYS,
        features: this.getTrialFeatures(),
        hasUsedTrial: false
      };
  }

  getEffectiveUserTier(user: any, trialStatus: TrialStatus): string {
    // If user has active paid subscription, use that
    if (user.subscription_tier !== 'free' && this.isSubscriptionActive(user)) {
      return user.subscription_tier;
    }
    
    // If trial is active, give extended tier benefits
    if (trialStatus.isActive) {
      return 'extended';
    }
    
    // Otherwise, free tier
    return 'free';
  }

  private getTrialFeatures(): string[] {
    return [
      '7-day email retention',
      'Custom domains (techsci.dev, techsci.xyz)',
      '100 emails per day',
      'Email forwarding',
      'Priority support',
      'API access',
      'Bulk email creation'
    ];
  }

  private isSubscriptionActive(user: any): boolean {
    if (!user.subscription_expires_at) return false;
    return new Date(user.subscription_expires_at) > new Date();
  }

  private async trackTrialEvent(userId: string, event: string, metadata: any): Promise<void> {
    // TODO: Replace with actual Supabase client
    console.log("Tracking trial event:", { userId, event, metadata });
  }
}
