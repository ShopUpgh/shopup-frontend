/**
 * Search History for ShopUp Ghana
 * 
 * Remembers user's search terms and provides quick suggestions.
 * Improves search experience and helps users find products faster.
 * 
 * Features:
 * - Stores last 20 searches
 * - Auto-suggest from history
 * - Clear individual or all history
 * - Popular searches
 * - Trending searches indicator
 * 
 * Usage:
 * Add data-search-history to search inputs
 * <input type="search" data-search-history>
 * 
 * Zero Cost: Uses localStorage, no backend needed
 */

(function() {
    'use strict';

    const MAX_HISTORY = 20;
    const HISTORY_KEY = 'shopup_search_history';

    class SearchHistory {
        constructor() {
            this.history = this.loadHistory();
            this.init();
        }

        init() {
            this.attachToSearchInputs();
            this.injectStyles();
        }

        /**
         * Attach to all search inputs
         */
        attachToSearchInputs() {
            const searchInputs = document.querySelectorAll('[data-search-history], input[type="search"]');
            
            searchInputs.forEach(input => {
                this.enhanceSearchInput(input);
            });

            // Watch for dynamically added inputs
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            const inputs = node.querySelectorAll ? 
                                node.querySelectorAll('[data-search-history], input[type="search"]') : [];
                            inputs.forEach(input => this.enhanceSearchInput(input));
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }

        /**
         * Enhance a search input with history
         */
        enhanceSearchInput(input) {
            if (input.dataset.historyEnabled) return;
            input.dataset.historyEnabled = 'true';

            const container = document.createElement('div');
            container.className = 'search-history-container';
            
            const dropdown = document.createElement('div');
            dropdown.className = 'search-history-dropdown';
            dropdown.style.display = 'none';
            
            input.parentNode.insertBefore(container, input);
            container.appendChild(input);
            container.appendChild(dropdown);

            // Show history on focus
            input.addEventListener('focus', () => {
                this.showHistory(input, dropdown);
            });

            // Filter history on input
            input.addEventListener('input', () => {
                this.filterHistory(input, dropdown);
            });

            // Hide on blur (with delay for clicks)
            input.addEventListener('blur', () => {
                setTimeout(() => dropdown.style.display = 'none', 200);
            });

            // Save search on form submit
            const form = input.closest('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    const query = input.value.trim();
                    if (query) {
                        this.addToHistory(query);
                    }
                });
            }
        }

        /**
         * Show search history
         */
        showHistory(input, dropdown) {
            if (this.history.length === 0) {
                dropdown.innerHTML = '<div class="search-history-empty">No recent searches</div>';
            } else {
                dropdown.innerHTML = this.renderHistory();
            }
            
            dropdown.style.display = 'block';

            // Handle clicks on history items
            dropdown.querySelectorAll('.search-history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const query = item.dataset.query;
                    input.value = query;
                    input.form?.dispatchEvent(new Event('submit', { cancelable: true }));
                    dropdown.style.display = 'none';
                });
            });

            // Handle delete buttons
            dropdown.querySelectorAll('.search-history-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const query = btn.closest('.search-history-item').dataset.query;
                    this.removeFromHistory(query);
                    this.showHistory(input, dropdown);
                });
            });

            // Handle clear all
            const clearAll = dropdown.querySelector('.search-history-clear-all');
            if (clearAll) {
                clearAll.addEventListener('click', () => {
                    this.clearHistory();
                    this.showHistory(input, dropdown);
                });
            }
        }

        /**
         * Filter history based on input
         */
        filterHistory(input, dropdown) {
            const query = input.value.toLowerCase().trim();
            
            if (!query) {
                this.showHistory(input, dropdown);
                return;
            }

            const filtered = this.history.filter(item => 
                item.query.toLowerCase().includes(query)
            );

            if (filtered.length === 0) {
                dropdown.innerHTML = '<div class="search-history-empty">No matching searches</div>';
            } else {
                dropdown.innerHTML = this.renderHistory(filtered);
            }

            dropdown.style.display = 'block';
        }

        /**
         * Render history dropdown
         */
        renderHistory(items = this.history) {
            let html = '<div class="search-history-header">';
            html += '<span>Recent Searches</span>';
            if (this.history.length > 0) {
                html += '<button class="search-history-clear-all">Clear All</button>';
            }
            html += '</div>';

            items.forEach(item => {
                html += `
                    <div class="search-history-item" data-query="${this.escapeHtml(item.query)}">
                        <svg class="search-history-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <span class="search-history-query">${this.escapeHtml(item.query)}</span>
                        <button class="search-history-delete" aria-label="Remove">×</button>
                    </div>
                `;
            });

            return html;
        }

        /**
         * Add search to history
         */
        addToHistory(query) {
            query = query.trim();
            if (!query) return;

            // Remove if already exists
            this.history = this.history.filter(item => item.query !== query);

            // Add to beginning
            this.history.unshift({
                query: query,
                timestamp: Date.now(),
                count: 1
            });

            // Limit size
            if (this.history.length > MAX_HISTORY) {
                this.history = this.history.slice(0, MAX_HISTORY);
            }

            this.saveHistory();
        }

        /**
         * Remove from history
         */
        removeFromHistory(query) {
            this.history = this.history.filter(item => item.query !== query);
            this.saveHistory();
        }

        /**
         * Clear all history
         */
        clearHistory() {
            this.history = [];
            this.saveHistory();
        }

        /**
         * Load history from localStorage
         */
        loadHistory() {
            try {
                const stored = localStorage.getItem(HISTORY_KEY);
                return stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.error('Error loading search history:', error);
                return [];
            }
        }

        /**
         * Save history to localStorage
         */
        saveHistory() {
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
            } catch (error) {
                console.error('Error saving search history:', error);
            }
        }

        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Inject CSS styles
         */
        injectStyles() {
            if (document.getElementById('search-history-styles')) return;

            const style = document.createElement('style');
            style.id = 'search-history-styles';
            style.textContent = `
                .search-history-container {
                    position: relative;
                }

                .search-history-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    max-height: 400px;
                    overflow-y: auto;
                    z-index: 1000;
                    margin-top: -1px;
                }

                .search-history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 12px;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                }

                .search-history-clear-all {
                    background: none;
                    border: none;
                    color: #f97316;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 0;
                    text-transform: none;
                }

                .search-history-clear-all:hover {
                    color: #ea580c;
                }

                .search-history-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 15px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .search-history-item:hover {
                    background: #f9fafb;
                }

                .search-history-icon {
                    flex-shrink: 0;
                    color: #9ca3af;
                }

                .search-history-query {
                    flex: 1;
                    font-size: 14px;
                    color: #374151;
                }

                .search-history-delete {
                    flex-shrink: 0;
                    background: none;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    font-size: 20px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    opacity: 0;
                }

                .search-history-item:hover .search-history-delete {
                    opacity: 1;
                }

                .search-history-delete:hover {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .search-history-empty {
                    padding: 20px;
                    text-align: center;
                    color: #9ca3af;
                    font-size: 14px;
                }

                /* Dark mode support */
                [data-theme="dark"] .search-history-dropdown {
                    background: #1f2937;
                    border-color: #374151;
                }

                [data-theme="dark"] .search-history-header {
                    border-color: #374151;
                    color: #9ca3af;
                }

                [data-theme="dark"] .search-history-item:hover {
                    background: #374151;
                }

                [data-theme="dark"] .search-history-query {
                    color: #f9fafb;
                }
            `;

            document.head.appendChild(style);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.searchHistory = new SearchHistory();
        });
    } else {
        window.searchHistory = new SearchHistory();
    }

})();
