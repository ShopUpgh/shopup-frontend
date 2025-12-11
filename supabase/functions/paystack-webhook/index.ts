/**
 * Supabase Edge Function: Paystack Webhook Handler
 * 
 * This function handles webhook events from Paystack.
 * It validates webhook signatures and processes payment events.
 * 
 * Deploy: supabase functions deploy paystack-webhook
 * 
 * Configure in Paystack Dashboard:
 *   Webhook URL: https://your-project.supabase.co/functions/v1/paystack-webhook
 *   Events: charge.success, charge.failed, transfer.success, transfer.failed
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    channel: string;
    paid_at?: string;
    customer: {
      email: string;
      customer_code: string;
    };
    metadata?: any;
  };
}

/**
 * Verify Paystack webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  const hash = createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

serve(async (req) => {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    if (!verifySignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse webhook event
    const event: PaystackWebhookEvent = JSON.parse(rawBody);
    console.log(`Received webhook event: ${event.event}`);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Process based on event type
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(supabase, event);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(supabase, event);
        break;
      
      case 'transfer.success':
        await handleTransferSuccess(supabase, event);
        break;
      
      case 'transfer.failed':
        await handleTransferFailed(supabase, event);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    // Log webhook for audit trail
    await supabase
      .from('webhook_events')
      .insert({
        provider: 'paystack',
        event_type: event.event,
        event_data: event.data,
        reference: event.data.reference,
        processed_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle successful payment charge
 */
async function handleChargeSuccess(supabase: any, event: PaystackWebhookEvent) {
  const { data } = event;
  const amount = data.amount / 100; // Convert from kobo to cedis

  console.log(`Processing charge.success for ${data.reference}`);

  // Update payment transaction
  const { error: updateError } = await supabase
    .from('payment_transactions')
    .update({
      status: 'success',
      paystack_status: data.status,
      payment_channel: data.channel,
      paid_at: data.paid_at,
      paystack_response: data,
      webhook_received_at: new Date().toISOString()
    })
    .eq('transaction_ref', data.reference);

  if (updateError) {
    console.error('Failed to update payment transaction:', updateError);
    return;
  }

  // Get order ID from payment transaction
  const { data: payment } = await supabase
    .from('payment_transactions')
    .select('order_id')
    .eq('transaction_ref', data.reference)
    .single();

  if (payment?.order_id) {
    // Update order status to confirmed
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.order_id);

    console.log(`✅ Order ${payment.order_id} marked as paid`);
  }

  // Log audit trail
  await supabase
    .from('payment_audit_log')
    .insert({
      transaction_ref: data.reference,
      order_id: payment?.order_id,
      action: 'webhook_success',
      status: 'success',
      amount: amount,
      metadata: {
        channel: data.channel,
        customer_email: data.customer.email,
        paid_at: data.paid_at
      }
    });
}

/**
 * Handle failed payment charge
 */
async function handleChargeFailed(supabase: any, event: PaystackWebhookEvent) {
  const { data } = event;
  
  console.log(`Processing charge.failed for ${data.reference}`);

  // Update payment transaction
  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      paystack_status: data.status,
      paystack_response: data,
      webhook_received_at: new Date().toISOString()
    })
    .eq('transaction_ref', data.reference);

  // Get order ID
  const { data: payment } = await supabase
    .from('payment_transactions')
    .select('order_id')
    .eq('transaction_ref', data.reference)
    .single();

  if (payment?.order_id) {
    // Update order status to failed
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        order_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.order_id);
  }

  // Log audit trail
  await supabase
    .from('payment_audit_log')
    .insert({
      transaction_ref: data.reference,
      order_id: payment?.order_id,
      action: 'webhook_failed',
      status: 'failed',
      amount: data.amount / 100,
      metadata: {
        channel: data.channel,
        customer_email: data.customer.email
      }
    });
}

/**
 * Handle successful transfer (for seller payouts)
 */
async function handleTransferSuccess(supabase: any, event: PaystackWebhookEvent) {
  const { data } = event;
  
  console.log(`Processing transfer.success for ${data.reference}`);

  // Log transfer success
  await supabase
    .from('payment_audit_log')
    .insert({
      transaction_ref: data.reference,
      action: 'transfer_success',
      status: 'success',
      amount: data.amount / 100,
      metadata: data
    });
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(supabase: any, event: PaystackWebhookEvent) {
  const { data } = event;
  
  console.log(`Processing transfer.failed for ${data.reference}`);

  // Log transfer failure
  await supabase
    .from('payment_audit_log')
    .insert({
      transaction_ref: data.reference,
      action: 'transfer_failed',
      status: 'failed',
      amount: data.amount / 100,
      metadata: data
    });
}
