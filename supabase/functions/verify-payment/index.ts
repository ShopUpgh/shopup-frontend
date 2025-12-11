/**
 * Supabase Edge Function: Payment Verification
 * 
 * This function verifies Paystack payments before allowing order creation.
 * It prevents fraudulent orders by validating payment status with Paystack API.
 * 
 * Deploy: supabase functions deploy verify-payment
 * 
 * Usage:
 *   POST /functions/v1/verify-payment
 *   Body: { reference: "TXN-xxx", orderId: "uuid", amount: 100.00 }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  reference: string;
  orderId: string;
  amount: number;
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string;
    customer: {
      email: string;
      customer_code: string;
    };
    metadata?: any;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role (bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    const { reference, orderId, amount }: VerificationRequest = await req.json();

    // Validate input
    if (!reference || !orderId || !amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: reference, orderId, amount' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if payment already verified (prevent double processing)
    const { data: existingPayment } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_ref', reference)
      .single();

    if (existingPayment && existingPayment.status === 'success') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: true,
          message: 'Payment already verified',
          payment: existingPayment
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment with Paystack API
    console.log(`Verifying payment with Paystack: ${reference}`);
    
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paystackResponse.ok) {
      console.error('Paystack API error:', paystackResponse.statusText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to verify payment with Paystack' 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paystackData: PaystackResponse = await paystackResponse.json();

    if (!paystackData.status) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false,
          error: paystackData.message || 'Payment verification failed'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payment details
    const paidAmount = paystackData.data.amount / 100; // Convert from kobo to cedis
    const expectedAmount = parseFloat(amount.toString());

    if (paystackData.data.status !== 'success') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false,
          error: 'Payment not successful',
          status: paystackData.data.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check amount matches (with 0.01 tolerance for rounding)
    if (Math.abs(paidAmount - expectedAmount) > 0.01) {
      console.error(`Amount mismatch: Expected ${expectedAmount}, got ${paidAmount}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false,
          error: 'Payment amount mismatch',
          expected: expectedAmount,
          received: paidAmount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or create payment transaction record
    const paymentData = {
      transaction_ref: reference,
      paystack_reference: reference,
      order_id: orderId,
      amount: paidAmount,
      currency: paystackData.data.currency,
      payment_channel: paystackData.data.channel,
      customer_email: paystackData.data.customer.email,
      status: 'success',
      paystack_status: paystackData.data.status,
      paystack_response: paystackData.data,
      paid_at: paystackData.data.paid_at,
      verified_at: new Date().toISOString()
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payment_transactions')
      .upsert(paymentData, { 
        onConflict: 'transaction_ref'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Database error:', paymentError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to record payment verification',
          details: paymentError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log verification for audit trail
    await supabase
      .from('payment_audit_log')
      .insert({
        transaction_ref: reference,
        order_id: orderId,
        action: 'verify',
        status: 'success',
        amount: paidAmount,
        metadata: {
          channel: paystackData.data.channel,
          customer_email: paystackData.data.customer.email,
          verified_at: new Date().toISOString()
        }
      });

    console.log(`✅ Payment verified successfully: ${reference}`);

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: true,
        payment: payment,
        message: 'Payment verified successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-payment function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
