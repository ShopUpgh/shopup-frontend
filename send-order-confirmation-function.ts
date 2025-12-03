// supabase/functions/send-order-confirmation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface OrderEmailData {
  to: string
  customerName: string
  orderNumber: string
  orderDate: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
  deliveryAddress: string
  paymentMethod: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const orderData: OrderEmailData = await req.json()

    // Generate email HTML
    const emailHtml = generateOrderConfirmationEmail(orderData)

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'ShopUp <orders@shopup.gh>',
        to: [orderData.to],
        subject: `Order Confirmation - ${orderData.orderNumber}`,
        html: emailHtml
      })
    })

    const data = await res.json()

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

function generateOrderConfirmationEmail(data: OrderEmailData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
        <strong>${item.name}</strong><br>
        <span style="color: #718096;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right;">
        GH₵ ${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🛍️ ShopUp</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Order Confirmation</p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; color: white;">✓</span>
              </div>
              <h2 style="color: #2d3748; margin: 0 0 10px 0;">Thank You, ${data.customerName}!</h2>
              <p style="color: #718096; margin: 0;">Your order has been confirmed and is being processed.</p>
            </td>
          </tr>

          <!-- Order Number -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center;">
                <div style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Order Number</div>
                <div style="color: #10b981; font-size: 24px; font-weight: bold; font-family: monospace;">${data.orderNumber}</div>
              </div>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 15px; background: #f7fafc;"><strong>Subtotal</strong></td>
                  <td style="padding: 15px; background: #f7fafc; text-align: right;">GH₵ ${data.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; background: #f7fafc;">Tax</td>
                  <td style="padding: 15px; background: #f7fafc; text-align: right;">GH₵ ${data.tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; background: #f7fafc;">Delivery Fee</td>
                  <td style="padding: 15px; background: #f7fafc; text-align: right;">GH₵ ${data.deliveryFee.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; background: #10b981; color: white;"><strong>Total</strong></td>
                  <td style="padding: 15px; background: #10b981; color: white; text-align: right;"><strong>GH₵ ${data.total.toFixed(2)}</strong></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Info -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 50%; padding-right: 10px;">
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px;">
                      <h4 style="color: #2d3748; margin: 0 0 10px 0; font-size: 14px;">Delivery Address</h4>
                      <p style="color: #718096; margin: 0; font-size: 14px; line-height: 1.6;">${data.deliveryAddress}</p>
                    </div>
                  </td>
                  <td style="width: 50%; padding-left: 10px;">
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px;">
                      <h4 style="color: #2d3748; margin: 0 0 10px 0; font-size: 14px;">Payment Method</h4>
                      <p style="color: #718096; margin: 0; font-size: 14px;">${data.paymentMethod}</p>
                      <h4 style="color: #2d3748; margin: 15px 0 10px 0; font-size: 14px;">Order Date</h4>
                      <p style="color: #718096; margin: 0; font-size: 14px;">${data.orderDate}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px;">
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 14px;">📦 What's Next?</h4>
                <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                  Your order will be processed within 24 hours. You'll receive another email with tracking information once your order ships.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="https://shopup.gh/customer-orders.html" style="display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Track Your Order</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f7fafc; padding: 30px 40px; text-align: center;">
              <p style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">Need help? Contact us at <a href="mailto:support@shopup.gh" style="color: #10b981;">support@shopup.gh</a></p>
              <p style="color: #718096; margin: 0; font-size: 12px;">&copy; 2025 ShopUp. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
