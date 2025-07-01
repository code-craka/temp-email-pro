import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUser, getUserProfile } from '@/lib/auth'
import { generateEmail } from '@/lib/email-service'
import { PremiumFeatureRequired } from '@/lib/pricing'
import { addDays, addHours } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { customDomain } = body

    const supabase = createClient()

    // Check daily usage limits
    const today = new Date().toISOString().split('T')[0]
    const { data: dailyUsage } = await supabase
      .from('daily_usage')
      .select('emails_generated')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    const emailsGenerated = dailyUsage?.emails_generated || 0

    // Generate email with the service
    try {
      const emailAddress = await generateEmail(profile, { customDomain })
      
      // Calculate retention period based on tier
      let retentionHours = 1 // Free tier default
      const effectiveTier = await getEffectiveTier(user.id)
      
      switch (effectiveTier) {
        case 'quick':
          retentionHours = 24
          break
        case 'extended':
          retentionHours = 24 * 7 // 1 week
          break
        case 'pro':
          retentionHours = 24 * 30 // 30 days
          break
      }

      const expiresAt = addHours(new Date(), retentionHours)
      const domain = emailAddress.split('@')[1]

      // Save to database
      const { data: tempEmail, error: saveError } = await supabase
        .from('temp_emails')
        .insert({
          user_id: user.id,
          email_address: emailAddress,
          domain,
          provider: 'mail.tm', // Will be dynamic based on actual provider used
          expires_at: expiresAt.toISOString(),
          custom_domain: !!customDomain,
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving email:', saveError)
        return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
      }

      // Update daily usage
      await supabase.rpc('increment_daily_usage', {
        user_uuid: user.id,
        usage_type: 'emails_generated',
        increment_by: 1
      })

      // Log usage event
      await supabase
        .from('usage_logs')
        .insert({
          user_id: user.id,
          action: 'email_generated',
          resource_type: 'temp_email',
          resource_id: tempEmail.id,
          metadata: {
            domain,
            custom_domain: !!customDomain,
            retention_hours: retentionHours
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent')
        })

      return NextResponse.json({
        email: emailAddress,
        domain,
        expiresAt: expiresAt.toISOString(),
        retentionHours,
        id: tempEmail.id
      })

    } catch (error) {
      if (error instanceof PremiumFeatureRequired) {
        return NextResponse.json({
          error: 'Premium feature required',
          message: error.message,
          upgradeUrl: error.upgradeUrl,
          requiredTier: error.requiredTier
        }, { status: 402 })
      }

      console.error('Email generation error:', error)
      return NextResponse.json({ 
        error: 'Failed to generate email',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    
    // Get user's active emails
    const { data: emails, error } = await supabase
      .from('temp_emails')
      .select(`
        *,
        email_messages (
          id,
          sender,
          subject,
          received_at,
          is_read
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching emails:', error)
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
    }

    return NextResponse.json({ emails })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getEffectiveTier(userId: string): Promise<string> {
  const supabase = createClient()
  
  const { data } = await supabase.rpc('get_effective_user_tier', {
    user_uuid: userId
  })
  
  return data || 'free'
}