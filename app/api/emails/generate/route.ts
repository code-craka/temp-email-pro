import { NextRequest, NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/auth';
import type { EmailGenerationResponse } from '@/types/dashboard';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain, custom_domain } = body;

    const supabase = createClient();

    // Check user's subscription tier and limits
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = userProfile?.subscription_tier || 'free';

    // Check daily usage limits
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyUsage } = await supabase
      .from('daily_usage')
      .select('emails_generated')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const emailsGenerated = dailyUsage?.emails_generated || 0;
    
    // Define tier limits
    const limits = {
      free: { emails_per_day: 5, retention_hours: 1 },
      quick: { emails_per_day: 25, retention_hours: 24 },
      extended: { emails_per_day: 100, retention_hours: 168 }, // 1 week
      pro: { emails_per_day: 500, retention_hours: 720 } // 30 days
    };

    const userLimits = limits[tier as keyof typeof limits] || limits.free;

    if (emailsGenerated >= userLimits.emails_per_day) {
      return NextResponse.json({
        error: 'Daily limit reached',
        message: `You've reached your daily limit of ${userLimits.emails_per_day} emails. Upgrade to generate more.`,
        upgradeUrl: '/pricing'
      }, { status: 402 });
    }

    // Generate email address
    const emailAddress = generateRandomEmail(domain);
    const expiresAt = new Date(Date.now() + userLimits.retention_hours * 60 * 60 * 1000);

    // Save to database
    const { data: tempEmail, error: saveError } = await supabase
      .from('temp_emails')
      .insert({
        user_id: user.id,
        email_address: emailAddress,
        domain: emailAddress.split('@')[1],
        provider: 'mail.tm',
        expires_at: expiresAt.toISOString(),
        custom_domain: !!custom_domain,
        is_active: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving email:', saveError);
      return NextResponse.json({ error: 'Failed to save email' }, { status: 500 });
    }

    // Update daily usage
    await supabase.rpc('increment_daily_usage', {
      user_uuid: user.id,
      usage_type: 'emails_generated',
      increment_by: 1
    });

    const response: EmailGenerationResponse = {
      email: emailAddress,
      domain: emailAddress.split('@')[1],
      expires_at: expiresAt.toISOString(),
      retention_hours: userLimits.retention_hours,
      id: tempEmail.id,
      provider: 'mail.tm'
    };

    return NextResponse.json({ data: response });

  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate email',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRandomEmail(customDomain?: string): string {
  const adjectives = ['quick', 'smart', 'cool', 'fast', 'pro', 'tech', 'dev', 'ninja', 'guru'];
  const nouns = ['user', 'mail', 'temp', 'test', 'demo', 'box', 'inbox', 'app'];
  const numbers = Math.floor(Math.random() * 9999);
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const username = `${adj}${noun}${numbers}`;
  
  const domain = customDomain || 'tempmail.org';
  
  return `${username}@${domain}`;
}