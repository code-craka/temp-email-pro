-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'quick', 'extended', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  usage_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User trials table
CREATE TABLE user_trials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trial_type TEXT NOT NULL DEFAULT 'extended',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trial_type)
);

-- Temporary emails table
CREATE TABLE temp_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  domain TEXT NOT NULL,
  provider TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  custom_domain BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email messages table
CREATE TABLE email_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  temp_email_id UUID REFERENCES temp_emails(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  html_body TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs table for analytics
CREATE TABLE usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily usage tracking
CREATE TABLE daily_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emails_generated INTEGER DEFAULT 0,
  emails_received INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Revenue events for analytics
CREATE TABLE revenue_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  stripe_event_id TEXT,
  subscription_tier TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_temp_emails_user_id ON temp_emails(user_id);
CREATE INDEX idx_temp_emails_expires_at ON temp_emails(expires_at);
CREATE INDEX idx_temp_emails_is_active ON temp_emails(is_active);
CREATE INDEX idx_email_messages_temp_email_id ON email_messages(temp_email_id);
CREATE INDEX idx_email_messages_received_at ON email_messages(received_at);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_daily_usage_user_date ON daily_usage(user_id, date);
CREATE INDEX idx_revenue_events_user_id ON revenue_events(user_id);
CREATE INDEX idx_revenue_events_created_at ON revenue_events(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- User trials policies
CREATE POLICY "Users can view own trials" ON user_trials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trials" ON user_trials FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Temp emails policies
CREATE POLICY "Users can view own emails" ON temp_emails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emails" ON temp_emails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emails" ON temp_emails FOR UPDATE USING (auth.uid() = user_id);

-- Email messages policies
CREATE POLICY "Users can view messages for own emails" ON email_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM temp_emails 
    WHERE temp_emails.id = email_messages.temp_email_id 
    AND temp_emails.user_id = auth.uid()
  )
);
CREATE POLICY "System can insert messages" ON email_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update messages for own emails" ON email_messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM temp_emails 
    WHERE temp_emails.id = email_messages.temp_email_id 
    AND temp_emails.user_id = auth.uid()
  )
);

-- Usage logs policies (read-only for users)
CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert usage logs" ON usage_logs FOR INSERT WITH CHECK (true);

-- Daily usage policies
CREATE POLICY "Users can view own daily usage" ON daily_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage daily usage" ON daily_usage FOR ALL WITH CHECK (true);

-- Revenue events policies (admin only, but allow system inserts)
CREATE POLICY "System can manage revenue events" ON revenue_events FOR ALL WITH CHECK (true);

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_effective_user_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_tier TEXT;
  has_active_trial BOOLEAN;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM users
  WHERE id = user_uuid;
  
  -- Check for active trial
  SELECT EXISTS(
    SELECT 1 FROM user_trials
    WHERE user_id = user_uuid
    AND is_active = true
    AND expires_at > NOW()
  ) INTO has_active_trial;
  
  -- If user has active trial, return 'extended' tier
  IF has_active_trial THEN
    RETURN 'extended';
  END IF;
  
  RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily usage
CREATE OR REPLACE FUNCTION increment_daily_usage(
  user_uuid UUID,
  usage_type TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_usage (user_id, date, emails_generated, emails_received, api_calls)
  VALUES (
    user_uuid,
    CURRENT_DATE,
    CASE WHEN usage_type = 'emails_generated' THEN increment_by ELSE 0 END,
    CASE WHEN usage_type = 'emails_received' THEN increment_by ELSE 0 END,
    CASE WHEN usage_type = 'api_calls' THEN increment_by ELSE 0 END
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    emails_generated = daily_usage.emails_generated + 
      CASE WHEN usage_type = 'emails_generated' THEN increment_by ELSE 0 END,
    emails_received = daily_usage.emails_received + 
      CASE WHEN usage_type = 'emails_received' THEN increment_by ELSE 0 END,
    api_calls = daily_usage.api_calls + 
      CASE WHEN usage_type = 'api_calls' THEN increment_by ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to clean up expired emails
CREATE OR REPLACE FUNCTION cleanup_expired_emails()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired emails and their messages
  WITH deleted_emails AS (
    DELETE FROM temp_emails
    WHERE expires_at < NOW()
    RETURNING id
  )
  DELETE FROM email_messages
  WHERE temp_email_id IN (SELECT id FROM deleted_emails);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;