/**
 * Supabase Edge Function: Payment Verification
 * 
 * CRITICAL SECURITY FUNCTION
 * This function verifies payments with Paystack API server-side
 * Prevents client-side payment fraud
 * 
 * Deploy to Supabase: supabase functions deploy verify-payment
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { reference } = await req.json()

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'Payment reference is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify payment with Paystack API
    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const verificationData = await verificationResponse.json()

    if (!verificationResponse.ok) {
      console.error('Paystack verification failed:', verificationData)
      return new Response(
        JSON.stringify({ 
          status: 'failed', 
          error: 'Payment verification failed',
          details: verificationData
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if payment was successful
    const paymentSuccessful = verificationData.data.status === 'success'

    // Log verification result
    console.log('Payment verification:', {
      reference,
      status: verificationData.data.status,
      amount: verificationData.data.amount,
      successful: paymentSuccessful
    })

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Store verification result in database
    await supabase.from('payment_verifications').insert({
      payment_reference: reference,
      verification_status: verificationData.data.status,
      amount: verificationData.data.amount / 100, // Convert from kobo to GHS
      verified_at: new Date().toISOString(),
      paystack_response: verificationData
    })

    return new Response(
      JSON.stringify({
        status: paymentSuccessful ? 'success' : 'failed',
        data: {
          reference,
          amount: verificationData.data.amount / 100,
          status: verificationData.data.status,
          verified: paymentSuccessful
        }
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
