/**
 * Product Comparison Feature
 * Zero-cost feature for comparing up to 4 products side-by-side
 * Part of ShopUp Ghana's zero-cost UX enhancements
 */

class ProductComparison {
    constructor() {
        this.maxProducts = 4;
        this.storageKey = 'shopup_comparison_products';
        this.comparisonProducts = this.loadFromStorage();
        this.init();
    }

    init() {
        this.createComparisonButton();
        this.createComparisonBar();
        this.attachEventListeners();
        this.updateUI();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading comparison products:', e);
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.comparisonProducts));
        } catch (e) {
            console.error('Error saving comparison products:', e);
        }
    }

    createComparisonButton() {
        // Add comparison buttons to product cards
        const productCards = document.querySelectorAll('[data-product-id]');
        
        productCards.forEach(card => {
            if (card.querySelector('.comparison-btn')) return; // Already added
            
            const productId = card.dataset.productId;
            const button = document.createElement('button');
            button.className = 'comparison-btn';
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z" 
                          fill="currentColor"/>
                </svg>
                <span>Compare</span>
            `;
            button.title = 'Add to comparison';
            button.dataset.productId = productId;
            
            // Position button
            const actionsDiv = card.querySelector('.product-actions') || card;
            actionsDiv.appendChild(button);
        });
    }

    createComparisonBar() {
        // Create floating comparison bar
        const bar = document.createElement('div');
        bar.className = 'comparison-bar';
        bar.innerHTML = `
            <div class="comparison-bar-content">
                <div class="comparison-products"></div>
                <div class="comparison-actions">
                    <button class="btn-compare" disabled>
                        Compare (<span class="count">0</span>)
                    </button>
                    <button class="btn-clear-comparison">Clear All</button>
                </div>
            </div>
        `;
        document.body.appendChild(bar);
    }

    attachEventListeners() {
        // Add to comparison
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.comparison-btn');
            if (btn) {
                e.preventDefault();
                const productId = btn.dataset.productId;
                this.toggleProduct(productId);
            }
        });

        // Compare button
        document.querySelector('.btn-compare')?.addEventListener('click', () => {
            this.showComparisonModal();
        });

        // Clear all
        document.querySelector('.btn-clear-comparison')?.addEventListener('click', () => {
            this.clearAll();
        });

        // Remove from comparison bar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-comparison-item')) {
                const productId = e.target.closest('.remove-comparison-item').dataset.productId;
                this.removeProduct(productId);
            }
        });
    }

    toggleProduct(productId) {
        const index = this.comparisonProducts.findIndex(p => p.id === productId);
        
        if (index > -1) {
            this.removeProduct(productId);
        } else {
            this.addProduct(productId);
        }
    }

    addProduct(productId) {
        if (this.comparisonProducts.length >= this.maxProducts) {
            this.showMessage(`You can only compare up to ${this.maxProducts} products at once.`, 'warning');
            return;
        }

        // Get product data from the card
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (!card) return;

        const product = {
            id: productId,
            name: card.querySelector('.product-name')?.textContent || 'Unknown Product',
            price: card.querySelector('.product-price')?.textContent || 'N/A',
            image: card.querySelector('img')?.src || '',
            category: card.dataset.category || 'N/A',
            condition: card.dataset.condition || 'N/A',
            inStock: card.dataset.inStock !== 'false'
        };

        this.comparisonProducts.push(product);
        this.saveToStorage();
        this.updateUI();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `comparison-toast comparison-toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    removeProduct(productId) {
        this.comparisonProducts = this.comparisonProducts.filter(p => p.id !== productId);
        this.saveToStorage();
        this.updateUI();
    }

    clearAll() {
        // Show custom confirmation modal instead of browser confirm
        const modal = document.createElement('div');
        modal.className = 'comparison-confirm-modal';
        modal.innerHTML = `
            <div class="comparison-confirm-content">
                <h3>Clear Comparison?</h3>
                <p>Remove all products from comparison?</p>
                <div class="comparison-confirm-actions">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-confirm">Clear All</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-confirm').addEventListener('click', () => {
            this.comparisonProducts = [];
            this.saveToStorage();
            this.updateUI();
            modal.remove();
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    updateUI() {
        // Update comparison bar
        const bar = document.querySelector('.comparison-bar');
        const productsContainer = bar?.querySelector('.comparison-products');
        const compareBtn = bar?.querySelector('.btn-compare');
        const countSpan = bar?.querySelector('.count');

        if (!bar) return;

        // Show/hide bar
        if (this.comparisonProducts.length > 0) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }

        // Update products in bar
        if (productsContainer) {
            productsContainer.innerHTML = this.comparisonProducts.map(product => `
                <div class="comparison-item">
                    <img src="${this.escapeHtml(product.image)}" alt="${this.escapeHtml(product.name)}">
                    <button class="remove-comparison-item" data-product-id="${this.escapeHtml(product.id)}">
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            `).join('');
        }

        // Update count and button state
        if (countSpan) countSpan.textContent = this.comparisonProducts.length;
        if (compareBtn) {
            compareBtn.disabled = this.comparisonProducts.length < 2;
        }

        // Update product card buttons
        document.querySelectorAll('.comparison-btn').forEach(btn => {
            const productId = btn.dataset.productId;
            const isInComparison = this.comparisonProducts.some(p => p.id === productId);
            
            if (isInComparison) {
                btn.classList.add('active');
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>Added</span>
                `;
            } else {
                btn.classList.remove('active');
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z" 
                              fill="currentColor"/>
                    </svg>
                    <span>Compare</span>
                `;
            }
        });
    }

    showComparisonModal() {
        if (this.comparisonProducts.length < 2) return;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'comparison-modal';
        modal.innerHTML = `
            <div class="comparison-modal-content">
                <div class="comparison-modal-header">
                    <h2>Product Comparison</h2>
                    <button class="close-comparison-modal">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                <div class="comparison-table-container">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                ${this.comparisonProducts.map(product => `
                                    <th>
                                        <img src="${this.escapeHtml(product.image)}" alt="${this.escapeHtml(product.name)}">
                                        <div class="product-name">${this.escapeHtml(product.name)}</div>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Price</strong></td>
                                ${this.comparisonProducts.map(p => `<td>${this.escapeHtml(p.price)}</td>`).join('')}
                            </tr>
                            <tr>
                                <td><strong>Category</strong></td>
                                ${this.comparisonProducts.map(p => `<td>${this.escapeHtml(p.category)}</td>`).join('')}
                            </tr>
                            <tr>
                                <td><strong>Condition</strong></td>
                                ${this.comparisonProducts.map(p => `<td>${this.escapeHtml(p.condition)}</td>`).join('')}
                            </tr>
                            <tr>
                                <td><strong>Availability</strong></td>
                                ${this.comparisonProducts.map(p => `
                                    <td>
                                        <span class="stock-badge ${p.inStock ? 'in-stock' : 'out-of-stock'}">
                                            ${p.inStock ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </td>
                                `).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="comparison-modal-actions">
                    ${this.comparisonProducts.map(product => `
                        <a href="/product.html?id=${this.escapeHtml(product.id)}" class="btn-view-product">
                            View ${this.escapeHtml(product.name)}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Close modal
        modal.querySelector('.close-comparison-modal').addEventListener('click', () => {
            this.closeComparisonModal(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeComparisonModal(modal);
            }
        });

        // Keyboard support
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.closeComparisonModal(modal);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    closeComparisonModal(modal) {
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
    .comparison-btn {
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

    .comparison-btn:hover {
        background: #f5f5f5;
        border-color: #007bff;
        color: #007bff;
    }

    .comparison-btn.active {
        background: #007bff;
        border-color: #007bff;
        color: white;
    }

    .comparison-bar {
        position: fixed;
        bottom: -100px;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        padding: 15px;
        z-index: 999;
        transition: bottom 0.3s;
    }

    .comparison-bar.active {
        bottom: 0;
    }

    .comparison-bar-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }

    .comparison-products {
        display: flex;
        gap: 10px;
        flex: 1;
    }

    .comparison-item {
        position: relative;
        width: 60px;
        height: 60px;
        border: 2px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
    }

    .comparison-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .remove-comparison-item {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #dc3545;
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .comparison-actions {
        display: flex;
        gap: 10px;
    }

    .btn-compare, .btn-clear-comparison {
        padding: 10px 20px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 500;
    }

    .btn-compare {
        background: #007bff;
        color: white;
    }

    .btn-compare:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .btn-clear-comparison {
        background: #f5f5f5;
        color: #333;
    }

    .comparison-modal {
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

    .comparison-modal.closing {
        animation: fadeOut 0.3s;
    }

    .comparison-modal-content {
        background: white;
        border-radius: 12px;
        max-width: 1200px;
        width: 100%;
        max-height: 90vh;
        overflow: auto;
        animation: slideUp 0.3s;
    }

    .comparison-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
    }

    .close-comparison-modal {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        color: #666;
    }

    .comparison-table-container {
        overflow-x: auto;
        padding: 20px;
    }

    .comparison-table {
        width: 100%;
        border-collapse: collapse;
    }

    .comparison-table th,
    .comparison-table td {
        padding: 15px;
        text-align: center;
        border: 1px solid #eee;
    }

    .comparison-table th {
        background: #f8f9fa;
        font-weight: 600;
    }

    .comparison-table th img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 10px;
    }

    .comparison-modal-actions {
        display: flex;
        gap: 10px;
        padding: 20px;
        border-top: 1px solid #eee;
        flex-wrap: wrap;
    }

    .btn-view-product {
        flex: 1;
        min-width: 200px;
        padding: 12px 20px;
        background: #007bff;
        color: white;
        text-align: center;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
    }

    .stock-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }

    .stock-badge.in-stock {
        background: #d4edda;
        color: #155724;
    }

    .stock-badge.out-of-stock {
        background: #f8d7da;
        color: #721c24;
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
        .comparison-bar-content {
            flex-direction: column;
            gap: 10px;
        }

        .comparison-table th img {
            width: 60px;
            height: 60px;
        }

        .comparison-modal-actions {
            flex-direction: column;
        }

        .btn-view-product {
            min-width: 100%;
        }
    }

    /* Dark mode support */
    [data-theme="dark"] .comparison-btn {
        background: #2d2d2d;
        border-color: #444;
        color: #fff;
    }

    [data-theme="dark"] .comparison-bar {
        background: #1a1a1a;
    }

    [data-theme="dark"] .comparison-modal-content {
        background: #2d2d2d;
        color: #fff;
    }

    [data-theme="dark"] .comparison-table th {
        background: #1a1a1a;
    }

    .comparison-toast {
        position: fixed;
        top: -50px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 500;
        z-index: 10002;
        transition: top 0.3s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .comparison-toast.show {
        top: 20px;
    }

    .comparison-toast-warning {
        background: #ffc107;
        color: #000;
    }

    .comparison-toast-info {
        background: #007bff;
        color: white;
    }

    .comparison-confirm-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .comparison-confirm-content {
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 400px;
        text-align: center;
    }

    .comparison-confirm-content h3 {
        margin: 0 0 10px 0;
    }

    .comparison-confirm-content p {
        margin: 0 0 20px 0;
        color: #666;
    }

    .comparison-confirm-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
    }

    .comparison-confirm-actions button {
        padding: 10px 20px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 500;
    }

    .comparison-confirm-actions .btn-cancel {
        background: #f5f5f5;
        color: #333;
    }

    .comparison-confirm-actions .btn-confirm {
        background: #dc3545;
        color: white;
    }

    [data-theme="dark"] .comparison-confirm-content {
        background: #2d2d2d;
        color: #fff;
    }

    [data-theme="dark"] .comparison-confirm-content p {
        color: #ccc;
    }
`;
document.head.appendChild(styles);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.productComparison = new ProductComparison();
    });
} else {
    window.productComparison = new ProductComparison();
}
