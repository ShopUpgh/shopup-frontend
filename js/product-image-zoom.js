/**
 * Product Image Zoom for ShopUp Ghana
 * 
 * Allows users to zoom into product images for better detail viewing.
 * Essential for fashion, electronics, and detail-oriented products.
 * 
 * Features:
 * - Hover to zoom
 * - Magnifier lens
 * - Touch support for mobile
 * - Pinch to zoom on mobile
 * - Fullscreen zoom option
 * 
 * Usage:
 * Add data-zoomable to product images
 * <img src="product.jpg" data-zoomable>
 * 
 * Zero Cost: Pure JavaScript, no external libraries
 */

(function() {
    'use strict';

    class ProductImageZoom {
        constructor() {
            this.init();
        }

        init() {
            this.attachToImages();
            this.injectStyles();
        }

        /**
         * Attach zoom functionality to images
         */
        attachToImages() {
            const images = document.querySelectorAll('[data-zoomable], .product-image img, .product-gallery img');
            
            images.forEach(img => {
                if (!img.dataset.zoomEnabled) {
                    this.enableZoom(img);
                }
            });

            // Watch for new images
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            const images = node.querySelectorAll ? 
                                node.querySelectorAll('[data-zoomable], .product-image img') : [];
                            images.forEach(img => {
                                if (!img.dataset.zoomEnabled) {
                                    this.enableZoom(img);
                                }
                            });
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }

        /**
         * Enable zoom on an image
         */
        enableZoom(img) {
            img.dataset.zoomEnabled = 'true';

            // Create zoom container
            const container = document.createElement('div');
            container.className = 'zoom-container';
            img.parentNode.insertBefore(container, img);
            container.appendChild(img);

            // Create magnifier lens
            const lens = document.createElement('div');
            lens.className = 'zoom-lens';
            lens.style.display = 'none';
            container.appendChild(lens);

            // Mouse events for desktop
            img.addEventListener('mouseenter', (e) => this.showZoom(img, lens));
            img.addEventListener('mousemove', (e) => this.moveZoom(e, img, lens));
            img.addEventListener('mouseleave', () => this.hideZoom(lens));

            // Touch events for mobile
            img.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.showZoom(img, lens);
            });

            img.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.moveZoom(mouseEvent, img, lens);
            });

            img.addEventListener('touchend', () => this.hideZoom(lens));

            // Click for fullscreen
            img.addEventListener('click', () => this.openFullscreen(img));

            // Add zoom hint icon
            const zoomHint = document.createElement('div');
            zoomHint.className = 'zoom-hint';
            zoomHint.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
            `;
            container.appendChild(zoomHint);
        }

        /**
         * Show zoom
         */
        showZoom(img, lens) {
            lens.style.display = 'block';
        }

        /**
         * Move zoom lens
         */
        moveZoom(e, img, lens) {
            const rect = img.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Position lens
            const lensSize = 100;
            lens.style.left = (x - lensSize / 2) + 'px';
            lens.style.top = (y - lensSize / 2) + 'px';

            // Calculate background position for zoom effect
            const fx = img.naturalWidth / img.width;
            const fy = img.naturalHeight / img.height;
            lens.style.backgroundImage = `url('${img.src}')`;
            lens.style.backgroundSize = `${img.naturalWidth}px ${img.naturalHeight}px`;
            lens.style.backgroundPosition = `-${x * fx - lensSize / 2}px -${y * fy - lensSize / 2}px`;
        }

        /**
         * Hide zoom
         */
        hideZoom(lens) {
            lens.style.display = 'none';
        }

        /**
         * Open fullscreen zoom
         */
        openFullscreen(img) {
            const fullscreen = document.createElement('div');
            fullscreen.className = 'zoom-fullscreen';
            fullscreen.innerHTML = `
                <button class="zoom-fullscreen-close">×</button>
                <img src="${img.src}" alt="Zoomed image">
            `;

            document.body.appendChild(fullscreen);
            document.body.style.overflow = 'hidden';

            const closeBtn = fullscreen.querySelector('.zoom-fullscreen-close');
            const fullImg = fullscreen.querySelector('img');

            closeBtn.addEventListener('click', () => this.closeFullscreen(fullscreen));
            fullscreen.addEventListener('click', (e) => {
                if (e.target === fullscreen) {
                    this.closeFullscreen(fullscreen);
                }
            });

            // Pinch to zoom on mobile
            if ('ontouchstart' in window) {
                this.enablePinchZoom(fullImg);
            }

            // Keyboard close
            const keyHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeFullscreen(fullscreen);
                    document.removeEventListener('keydown', keyHandler);
                }
            };
            document.addEventListener('keydown', keyHandler);

            setTimeout(() => fullscreen.classList.add('active'), 10);
        }

        /**
         * Close fullscreen zoom
         */
        closeFullscreen(fullscreen) {
            fullscreen.classList.remove('active');
            setTimeout(() => {
                fullscreen.remove();
                document.body.style.overflow = '';
            }, 300);
        }

        /**
         * Enable pinch to zoom on mobile
         */
        enablePinchZoom(img) {
            let initialDistance = 0;
            let currentScale = 1;

            img.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                }
            });

            img.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    const distance = this.getDistance(e.touches[0], e.touches[1]);
                    const scale = distance / initialDistance;
                    currentScale = Math.min(Math.max(1, scale), 3);
                    img.style.transform = `scale(${currentScale})`;
                }
            });

            img.addEventListener('touchend', () => {
                initialDistance = 0;
            });
        }

        /**
         * Get distance between two touch points
         */
        getDistance(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        /**
         * Inject CSS styles
         */
        injectStyles() {
            if (document.getElementById('zoom-styles')) return;

            const style = document.createElement('style');
            style.id = 'zoom-styles';
            style.textContent = `
                .zoom-container {
                    position: relative;
                    display: inline-block;
                    cursor: zoom-in;
                }

                .zoom-lens {
                    position: absolute;
                    width: 100px;
                    height: 100px;
                    border: 2px solid #f97316;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 100;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
                }

                .zoom-hint {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .zoom-container:hover .zoom-hint {
                    opacity: 1;
                }

                .zoom-fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .zoom-fullscreen.active {
                    opacity: 1;
                }

                .zoom-fullscreen img {
                    max-width: 90%;
                    max-height: 90%;
                    object-fit: contain;
                    transition: transform 0.3s;
                }

                .zoom-fullscreen-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid white;
                    color: white;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    font-size: 30px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .zoom-fullscreen-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }
            `;

            document.head.appendChild(style);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.productImageZoom = new ProductImageZoom();
        });
    } else {
        window.productImageZoom = new ProductImageZoom();
    }

})();
