
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

// TODO: Replace with your Supabase client
const supabase = {
    from: (table: string) => ({
        update: (data: any) => ({
            eq: (column: string, value: any) => {
                console.log(`Supabase: Updating ${table} where ${column} = ${value} with`, data);
                return Promise.resolve();
            }
        })
    })
};

// TODO: Replace with your revenue tracking logic
async function trackRevenue(data: any) {
    console.log("Tracking revenue:", data);
    return Promise.resolve();
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
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

async function handleSubscriptionSuccess(session: any) {
  const { userId, tier } = session.metadata;
  
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
    amount: session.amount_total / 100,
    tier,
    event: 'subscription_started'
  });
}

async function handlePaymentSuccess(invoice: any) {
    // Logic to handle successful payment
    console.log("Payment successful for invoice:", invoice.id);
}

async function handleSubscriptionCancelled(subscription: any) {
    // Logic to handle subscription cancellation
    console.log("Subscription cancelled:", subscription.id);
}
