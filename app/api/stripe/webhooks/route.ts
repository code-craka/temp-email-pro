
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// TODO: Replace with your Supabase client
const supabase = {
    from: (table: string) => ({
        update: (data: Record<string, unknown>) => ({
            eq: (column: string, value: unknown) => {
                console.log(`Supabase: Updating ${table} where ${column} = ${value} with`, data);
                return Promise.resolve();
            }
        })
    })
};

// TODO: Replace with your revenue tracking logic
async function trackRevenue(data: Record<string, unknown>) {
    console.log("Tracking revenue:", data);
    return Promise.resolve();
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleSubscriptionSuccess(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionSuccess(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;
  
  // Update user subscription
  await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_billing_cycle: new Date().toISOString()
    })
    .eq('id', userId);

  // Track revenue event
  await trackRevenue({
    userId,
    amount: (session.amount_total || 0) / 100,
    tier,
    event: 'subscription_started'
  });
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
    // Logic to handle successful payment
    console.log("Payment successful for invoice:", invoice.id);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    // Logic to handle subscription cancellation
    console.log("Subscription cancelled:", subscription.id);
}
