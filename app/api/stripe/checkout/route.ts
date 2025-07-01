
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with actual user retrieval logic
async function getCurrentUser(request: NextRequest) {
    return {
        id: 'user_123',
        email: 'test@example.com',
        stripe_customer_id: null
    }
}

export async function POST(request: NextRequest) {
  try {
    const { priceId, tier } = await request.json();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      
      // TODO: Update user with customer ID in your database
      // For now, we'll just log it
      console.log(`Created Stripe customer ${customerId} for user ${user.id}`);
    }

    // Create checkout session with revenue optimization
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?upgrade=success&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?upgrade=cancelled`,
      metadata: {
        userId: user.id,
        tier: tier
      },
      // Revenue optimization features
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
