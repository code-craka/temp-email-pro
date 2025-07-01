
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          subscription_tier: 'free' | 'quick' | 'extended' | 'pro' | 'enterprise';
          stripe_customer_id: string | null;
          subscription_expires_at: string | null;
          created_at: string;
          usage_count: number;
          last_billing_cycle: string | null;
        };
      };
      temp_emails: {
        Row: {
          id: string;
          user_id: string;
          email_address: string;
          expires_at: string;
          created_at: string;
          message_count: number;
          is_custom_domain: boolean;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          action: 'email_generated' | 'message_received' | 'api_call';
          timestamp: string;
          metadata: Record<string, any>;
        };
      };
    };
  };
}
