/**
 * Price Alerts Feature
 * Zero-cost feature for notifying users when product prices drop
 * Part of ShopUp Ghana's zero-cost UX enhancements
 */

class PriceAlerts {
    constructor() {
        this.storageKey = 'shopup_price_alerts';
        this.alerts = this.loadFromStorage();
        this.init();
    }

    init() {
        this.createAlertButtons();
        this.attachEventListeners();
        this.checkPriceChanges();
        
        // Check prices periodically (every hour when tab is active)
        setInterval(() => {
            if (!document.hidden) {
                this.checkPriceChanges();
            }
        }, 3600000); // 1 hour
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading price alerts:', e);
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.alerts));
        } catch (e) {
            console.error('Error saving price alerts:', e);
        }
    }

    createAlertButtons() {
        // Add price alert buttons to product cards
        const productCards = document.querySelectorAll('[data-product-id]');
        
        productCards.forEach(card => {
            if (card.querySelector('.price-alert-btn')) return; // Already added
            
            const productId = card.dataset.productId;
            const priceElement = card.querySelector('.product-price');
            if (!priceElement) return;

            const button = document.createElement('button');
            button.className = 'price-alert-btn';
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2a6 6 0 016 6c0 2.5 1 3 1 5H1c0-2 1-2.5 1-5a6 6 0 016-6z" 
                          stroke="currentColor" stroke-width="1.5"/>
                    <path d="M6 13a2 2 0 004 0" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <span>Price Alert</span>
            `;
            button.title = 'Get notified when price drops';
            button.dataset.productId = productId;
            
            const actionsDiv = card.querySelector('.product-actions') || card;
            actionsDiv.appendChild(button);
        });
    }

    attachEventListeners() {
        // Price alert button clicks
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.price-alert-btn');
            if (btn) {
                e.preventDefault();
                const productId = btn.dataset.productId;
                this.showAlertModal(productId);
            }
        });
    }

    showAlertModal(productId) {
        // Get product data
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (!card) return;

        const productName = card.querySelector('.product-name')?.textContent || 'Unknown Product';
        const priceText = card.querySelector('.product-price')?.textContent || '';
        const currentPrice = this.extractPrice(priceText);
        const productImage = card.querySelector('img')?.src || '';

        // Check if alert already exists
        const existingAlert = this.alerts.find(a => a.productId === productId);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'price-alert-modal';
        modal.innerHTML = `
            <div class="price-alert-modal-content">
                <div class="price-alert-modal-header">
                    <h2>Set Price Alert</h2>
                    <button class="close-price-alert-modal">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                <div class="price-alert-modal-body">
                    <div class="product-preview">
                        <img src="${productImage}" alt="${productName}">
                        <div>
                            <h3>${productName}</h3>
                            <p class="current-price">Current Price: ${priceText}</p>
                        </div>
                    </div>
                    
                    <form class="price-alert-form">
                        <div class="form-group">
                            <label for="target-price">Notify me when price drops to:</label>
                            <div class="price-input-group">
                                <span class="currency">GH₵</span>
                                <input 
                                    type="number" 
                                    id="target-price" 
                                    name="targetPrice"
                                    min="0"
                                    step="0.01"
                                    value="${existingAlert ? existingAlert.targetPrice : (currentPrice * 0.9).toFixed(2)}"
                                    required
                                >
                            </div>
                            <small class="help-text">
                                We'll email you when the price drops to or below this amount.
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="alert-email">Email address:</label>
                            <input 
                                type="email" 
                                id="alert-email" 
                                name="email"
                                placeholder="your@email.com"
                                value="${existingAlert ? existingAlert.email : ''}"
                                required
                            >
                        </div>

                        ${existingAlert ? `
                            <div class="alert-exists-message">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="currentColor"/>
                                    <path d="M8 4v4M8 10v1" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                You already have an alert for this product. Updating will replace the old one.
                            </div>
                        ` : ''}

                        <div class="price-alert-actions">
                            <button type="button" class="btn-cancel">Cancel</button>
                            <button type="submit" class="btn-set-alert">
                                ${existingAlert ? 'Update Alert' : 'Set Alert'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Handle form submission
        const form = modal.querySelector('.price-alert-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const targetPrice = parseFloat(formData.get('targetPrice'));
            const email = formData.get('email');

            if (targetPrice >= currentPrice) {
                alert('Target price must be lower than current price.');
                return;
            }

            this.setAlert(productId, {
                productName,
                productImage,
                currentPrice,
                targetPrice,
                email,
                createdAt: Date.now()
            });

            this.closeModal(modal);
            this.showSuccessMessage();
        });

        // Close handlers
        modal.querySelector('.close-price-alert-modal').addEventListener('click', () => {
            this.closeModal(modal);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        // Keyboard support
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    setAlert(productId, alertData) {
        // Remove existing alert for this product
        this.alerts = this.alerts.filter(a => a.productId !== productId);
        
        // Add new alert
        this.alerts.push({
            productId,
            ...alertData
        });

        this.saveToStorage();
        this.updateButtonStates();
    }

    removeAlert(productId) {
        this.alerts = this.alerts.filter(a => a.productId !== productId);
        this.saveToStorage();
        this.updateButtonStates();
    }

    checkPriceChanges() {
        this.alerts.forEach(alert => {
            const card = document.querySelector(`[data-product-id="${alert.productId}"]`);
            if (!card) return;

            const priceText = card.querySelector('.product-price')?.textContent || '';
            const currentPrice = this.extractPrice(priceText);

            if (currentPrice <= alert.targetPrice) {
                this.triggerAlert(alert, currentPrice);
            }
        });
    }

    triggerAlert(alert, newPrice) {
        // Show notification
        this.showNotification(alert, newPrice);
        
        // In a real implementation, you would also:
        // 1. Send email via Supabase Edge Function
        // 2. Create notification in database
        
        // Remove the alert after triggering
        this.removeAlert(alert.productId);
    }

    showNotification(alert, newPrice) {
        const notification = document.createElement('div');
        notification.className = 'price-drop-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <img src="${alert.productImage}" alt="${alert.productName}">
                <div class="notification-text">
                    <h4>Price Drop Alert!</h4>
                    <p>${alert.productName}</p>
                    <p class="price-info">
                        Was: GH₵ ${alert.currentPrice.toFixed(2)} → 
                        Now: <strong>GH₵ ${newPrice.toFixed(2)}</strong>
                    </p>
                </div>
                <button class="close-notification">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
    }

    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'price-alert-success';
        message.textContent = '✓ Price alert set successfully!';
        document.body.appendChild(message);

        setTimeout(() => message.classList.add('show'), 10);

        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    updateButtonStates() {
        document.querySelectorAll('.price-alert-btn').forEach(btn => {
            const productId = btn.dataset.productId;
            const hasAlert = this.alerts.some(a => a.productId === productId);
            
            if (hasAlert) {
                btn.classList.add('active');
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 2a6 6 0 016 6c0 2.5 1 3 1 5H1c0-2 1-2.5 1-5a6 6 0 016-6z"/>
                        <path d="M6 13a2 2 0 004 0"/>
                    </svg>
                    <span>Alert Set</span>
                `;
            }
        });
    }

    extractPrice(priceText) {
        const match = priceText.match(/[\d,]+\.?\d*/);
        return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
    }

    closeModal(modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// Styles
const styles = document.createElement('style');
styles.textContent = `
    .price-alert-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border: 1px solid #ddd;
        background: white;
        color: #333;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
    }

    .price-alert-btn:hover {
        background: #f5f5f5;
        border-color: #ffc107;
        color: #ffc107;
    }

    .price-alert-btn.active {
        background: #ffc107;
        border-color: #ffc107;
        color: white;
    }

    .price-alert-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.3s;
    }

    .price-alert-modal.closing {
        animation: fadeOut 0.3s;
    }

    .price-alert-modal-content {
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow: auto;
        animation: slideUp 0.3s;
    }

    .price-alert-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
    }

    .close-price-alert-modal {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        color: #666;
    }

    .price-alert-modal-body {
        padding: 20px;
    }

    .product-preview {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .product-preview img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
    }

    .product-preview h3 {
        margin: 0 0 5px 0;
        font-size: 16px;
    }

    .current-price {
        color: #666;
        font-size: 14px;
        margin: 0;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }

    .price-input-group {
        display: flex;
        align-items: center;
        border: 1px solid #ddd;
        border-radius: 6px;
        overflow: hidden;
    }

    .price-input-group .currency {
        padding: 10px 12px;
        background: #f8f9fa;
        border-right: 1px solid #ddd;
        font-weight: 500;
    }

    .price-input-group input {
        flex: 1;
        border: none;
        padding: 10px 12px;
        font-size: 16px;
    }

    .form-group input[type="email"] {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 16px;
    }

    .help-text {
        display: block;
        margin-top: 5px;
        color: #666;
        font-size: 13px;
    }

    .alert-exists-message {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 6px;
        margin-bottom: 20px;
        font-size: 14px;
    }

    .price-alert-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .btn-cancel, .btn-set-alert {
        padding: 10px 20px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
    }

    .btn-cancel {
        background: #f5f5f5;
        color: #333;
    }

    .btn-set-alert {
        background: #ffc107;
        color: #000;
    }

    .price-drop-notification {
        position: fixed;
        top: 20px;
        right: -400px;
        width: 350px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10001;
        transition: right 0.3s;
    }

    .price-drop-notification.show {
        right: 20px;
    }

    .notification-content {
        display: flex;
        gap: 15px;
        padding: 15px;
        align-items: start;
    }

    .notification-content img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
    }

    .notification-text {
        flex: 1;
    }

    .notification-text h4 {
        margin: 0 0 5px 0;
        color: #28a745;
        font-size: 14px;
    }

    .notification-text p {
        margin: 0 0 5px 0;
        font-size: 14px;
    }

    .price-info {
        color: #666;
        font-size: 13px;
    }

    .price-info strong {
        color: #28a745;
    }

    .close-notification {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 24px;
        height: 24px;
    }

    .price-alert-success {
        position: fixed;
        top: -50px;
        left: 50%;
        transform: translateX(-50%);
        background: #28a745;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 500;
        z-index: 10002;
        transition: top 0.3s;
    }

    .price-alert-success.show {
        top: 20px;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    @media (max-width: 768px) {
        .price-drop-notification {
            width: calc(100% - 40px);
            right: -100%;
        }

        .price-drop-notification.show {
            right: 20px;
        }
    }

    /* Dark mode support */
    [data-theme="dark"] .price-alert-btn {
        background: #2d2d2d;
        border-color: #444;
        color: #fff;
    }

    [data-theme="dark"] .price-alert-modal-content {
        background: #2d2d2d;
        color: #fff;
    }

    [data-theme="dark"] .product-preview {
        background: #1a1a1a;
    }

    [data-theme="dark"] .price-input-group .currency {
        background: #1a1a1a;
    }

    [data-theme="dark"] .price-drop-notification {
        background: #2d2d2d;
        color: #fff;
    }
`;
document.head.appendChild(styles);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.priceAlerts = new PriceAlerts();
    });
} else {
    window.priceAlerts = new PriceAlerts();
}
