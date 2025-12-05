// checkout-script.js
console.log('Checkout script loaded');

let supabaseClient = null;
let currentUser = null;
let customerId = null;
let selectedAddress = null;
let cart = [];
let orderTotal = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        alert('Please login to checkout');
        window.location.href = 'customer-login.html';
        return;
    }
    
    supabaseClient = window.supabase;
    
    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'customer-login.html';
        return;
    }
    
    currentUser = session.user;
    
    // Get customer ID
    const { data: profile } = await supabaseClient
        .from('customer_profiles')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
    
    customerId = profile.id;
    
    // Load data
    await loadAddresses();
    await loadCart();
    
    // Setup payment method selection
    setupPaymentMethodSelection();
    
    // Setup pay button
    document.getElementById('payBtn').addEventListener('click', processPayment);
});

async function loadAddresses() {
    try {
        const { data: addresses } = await supabaseClient
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', customerId)
            .eq('is_active', true)
            .order('is_default', { ascending: false })
            .limit(1);
        
        const section = document.getElementById('addressSection');
        
        if (!addresses || addresses.length === 0) {
            section.innerHTML = `
                <p>No delivery address found.</p>
                <a href="customer-addresses.html" style="color: #2d8a3e;">Add Address</a>
            `;
            return;
        }
        
        selectedAddress = addresses[0];
        
        // SECURITY: Sanitize user-generated address content
        const safeName = typeof sanitizeHTML === 'function' ? sanitizeHTML(selectedAddress.full_name) : selectedAddress.full_name;
        const safePhone = typeof sanitizeHTML === 'function' ? sanitizeHTML(selectedAddress.phone) : selectedAddress.phone;
        const safeStreet = typeof sanitizeHTML === 'function' ? sanitizeHTML(selectedAddress.street_address) : selectedAddress.street_address;
        const safeCity = typeof sanitizeHTML === 'function' ? sanitizeHTML(selectedAddress.city) : selectedAddress.city;
        const safeRegion = typeof sanitizeHTML === 'function' ? sanitizeHTML(selectedAddress.region) : selectedAddress.region;
        
        section.innerHTML = `
            <div style="padding: 15px; background: #f7fafc; border-radius: 8px;">
                <strong>${safeName}</strong><br>
                ${safePhone}<br>
                ${safeStreet}<br>
                ${safeCity}, ${safeRegion}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading addresses:', error);
    }
}

async function loadCart() {
    // For demo - in production, load from cart table or sessionStorage
    cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        // Demo cart item
        cart = [{
            id: '1',
            name: 'Sample Product',
            price: 50.00,
            quantity: 1,
            image: '📦'
        }];
    }
    
    displayCart();
    calculateTotals();
}

function displayCart() {
    const container = document.getElementById('cartItems');
    
    // SECURITY: Sanitize product names and other user content
    container.innerHTML = cart.map(item => {
        const safeName = typeof sanitizeHTML === 'function' ? sanitizeHTML(item.name) : item.name;
        const safePrice = parseFloat(item.price).toFixed(2);
        const safeQty = parseInt(item.quantity, 10);
        
        return `
            <div class="cart-item">
                <div class="item-image">${item.image || '📦'}</div>
                <div class="item-details">
                    <div class="item-name">${safeName}</div>
                    <div>Qty: ${safeQty}</div>
                    <div class="item-price">GH₵ ${safePrice}</div>
                </div>
            </div>
        `;
    }).join('');
}

function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = 10.00; // Fixed delivery for demo
    const total = subtotal + delivery;
    
    document.getElementById('subtotal').textContent = `GH₵ ${subtotal.toFixed(2)}`;
    document.getElementById('delivery').textContent = `GH₵ ${delivery.toFixed(2)}`;
    document.getElementById('total').textContent = `GH₵ ${total.toFixed(2)}`;
    
    orderTotal = total;
}

function setupPaymentMethodSelection() {
    const options = document.querySelectorAll('.payment-option');
    
    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

async function processPayment() {
    const payBtn = document.getElementById('payBtn');
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (!selectedAddress) {
        alert('Please select a delivery address');
        return;
    }
    
    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';
    
    try {
        // Create order first
        const orderId = await createOrder(selectedMethod);
        
        if (selectedMethod === 'cash_on_delivery') {
            // No payment needed
            window.location.href = `order-confirmation.html?orderId=${orderId}`;
            return;
        }
        
        // Initialize Paystack payment
        const reference = PaystackHelper.generateReference();
        
        // Create transaction record
        await PaystackHelper.createTransaction({
            reference: reference,
            orderId: orderId,
            customerId: customerId,
            amount: orderTotal,
            paymentMethod: selectedMethod,
            channel: selectedMethod,
            email: currentUser.email,
            phone: selectedAddress.phone
        }, supabaseClient);
        
        // Open Paystack popup
        const response = await PaystackHelper.initializePayment({
            email: currentUser.email,
            amount: orderTotal,
            reference: reference,
            customerName: selectedAddress.full_name,
            customerPhone: selectedAddress.phone,
            orderId: orderId,
            channels: getChannels(selectedMethod)
        });
        
        console.log('Payment response:', response);
        
        // Update transaction status
        await PaystackHelper.updateTransaction(
            reference,
            'success',
            response,
            supabaseClient
        );
        
        // Redirect to confirmation
        window.location.href = `customer-order-confirmation.html?orderId=${orderId}&reference=${reference}`;
        
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
    } finally {
        payBtn.disabled = false;
        payBtn.textContent = 'Complete Payment';
    }
}

function getChannels(method) {
    if (method === 'card') return ['card'];
    if (method === 'mobile_money') return ['mobile_money'];
    if (method === 'bank_transfer') return ['bank'];
    return ['card', 'mobile_money', 'bank'];
}

async function createOrder(paymentMethod) {
    try {
        // Generate order number
        const orderNumber = 'ORD-' + Date.now();
        
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([{
                order_number: orderNumber,
                customer_id: customerId,
                customer_name: selectedAddress.full_name,
                customer_email: currentUser.email,
                customer_phone: selectedAddress.phone,
                delivery_address: selectedAddress.street_address,
                delivery_city: selectedAddress.city,
                delivery_region: selectedAddress.region,
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'processing',
                order_status: 'pending',
                subtotal: orderTotal - 10,
                tax: 0,
                delivery_fee: 10,
                total: orderTotal,
                seller_id: cart[0]?.seller_id || null
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Create order items
        const orderItems = cart.map(item => ({
            order_id: data.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            line_total: item.price * item.quantity
        }));
        
        await supabaseClient
            .from('order_items')
            .insert(orderItems);
        
        return data.id;
        
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

console.log('✅ Checkout script loaded');