// Product Generator Script - Creates 40 sample products with images

const SAMPLE_PRODUCTS = [
    // Fashion & Clothing (10)
    {
        name: "Blue Cotton T-Shirt",
        category: "fashion",
        condition: "new",
        price: 45.00,
        compare_price: 65.00,
        quantity: 25,
        description: "Premium quality blue cotton t-shirt. Perfect for casual wear. Available in sizes XS to XXL. Machine washable and durable.",
        sku: "TSH-BLUE-001"
    },
    {
        name: "Black Denim Jeans",
        category: "fashion",
        condition: "new",
        price: 85.00,
        compare_price: 120.00,
        quantity: 15,
        description: "Classic black denim jeans with a comfortable fit. Features reinforced stitching and adjustable waistband. Perfect for all occasions.",
        sku: "JEANS-BLK-001"
    },
    {
        name: "Summer Floral Dress",
        category: "fashion",
        condition: "new",
        price: 95.00,
        compare_price: 140.00,
        quantity: 12,
        description: "Beautiful floral summer dress with vibrant colors. Lightweight and breathable fabric. Perfect for warm weather.",
        sku: "DRESS-FLR-001"
    },
    {
        name: "Wool Winter Jacket",
        category: "fashion",
        condition: "new",
        price: 150.00,
        compare_price: 220.00,
        quantity: 8,
        description: "Warm wool winter jacket with insulated lining. Water-resistant outer layer. Ideal for cold weather.",
        sku: "JACKET-WL-001"
    },
    {
        name: "White Casual Sneakers",
        category: "fashion",
        condition: "new",
        price: 65.00,
        compare_price: 95.00,
        quantity: 20,
        description: "Comfortable white sneakers for everyday wear. Cushioned sole for support. Versatile style matches any outfit.",
        sku: "SHOES-SNK-001"
    },
    {
        name: "Leather Belt Brown",
        category: "fashion",
        condition: "new",
        price: 35.00,
        compare_price: 55.00,
        quantity: 30,
        description: "Genuine leather belt in brown. Adjustable buckle. Professional and casual style suitable for any occasion.",
        sku: "BELT-BRN-001"
    },
    {
        name: "Red Polo Shirt",
        category: "fashion",
        condition: "new",
        price: 55.00,
        compare_price: 75.00,
        quantity: 18,
        description: "Classic red polo shirt. Breathable cotton blend. Perfect for casual meetings or weekend outings.",
        sku: "POLO-RED-001"
    },
    {
        name: "Black Leather Jacket",
        category: "fashion",
        condition: "new",
        price: 180.00,
        compare_price: 280.00,
        quantity: 6,
        description: "Premium black leather jacket. Stylish and durable. Classic piece that never goes out of style.",
        sku: "JACKET-BLK-001"
    },
    {
        name: "Striped Shirt",
        category: "fashion",
        condition: "new",
        price: 50.00,
        compare_price: 70.00,
        quantity: 22,
        description: "Casual striped shirt with alternating colors. Perfect for layering or standalone wear.",
        sku: "SHIRT-STR-001"
    },
    {
        name: "Denim Shorts",
        category: "fashion",
        condition: "new",
        price: 45.00,
        compare_price: 65.00,
        quantity: 16,
        description: "Comfortable denim shorts. Perfect for summer. Available in various sizes.",
        sku: "SHORT-DEM-001"
    },

    // Electronics (10)
    {
        name: "Wireless Earbuds",
        category: "electronics",
        condition: "new",
        price: 120.00,
        compare_price: 180.00,
        quantity: 14,
        description: "High-quality wireless earbuds with noise cancellation. Long battery life up to 8 hours.",
        sku: "AUDIO-EBD-001"
    },
    {
        name: "USB-C Cable",
        category: "electronics",
        condition: "new",
        price: 15.00,
        compare_price: 25.00,
        quantity: 50,
        description: "Durable USB-C charging and data cable. Fast charging support. 2-meter length.",
        sku: "CABLE-USB-001"
    },
    {
        name: "Phone Screen Protector",
        category: "electronics",
        condition: "new",
        price: 10.00,
        compare_price: 18.00,
        quantity: 40,
        description: "Tempered glass screen protector. Easy installation. Anti-fingerprint coating.",
        sku: "PROTECT-SCR-001"
    },
    {
        name: "Portable Power Bank",
        category: "electronics",
        condition: "new",
        price: 45.00,
        compare_price: 70.00,
        quantity: 20,
        description: "High capacity power bank (20000mAh). Fast charging. Compatible with all devices.",
        sku: "POWER-BANK-001"
    },
    {
        name: "Bluetooth Speaker",
        category: "electronics",
        condition: "new",
        price: 85.00,
        compare_price: 130.00,
        quantity: 11,
        description: "Portable Bluetooth speaker with excellent sound quality. Waterproof design. 12-hour battery.",
        sku: "AUDIO-SPK-001"
    },
    {
        name: "LED Desk Lamp",
        category: "electronics",
        condition: "new",
        price: 35.00,
        compare_price: 55.00,
        quantity: 17,
        description: "Energy-efficient LED desk lamp with adjustable brightness. USB powered.",
        sku: "LIGHT-LED-001"
    },
    {
        name: "Wireless Mouse",
        category: "electronics",
        condition: "new",
        price: 25.00,
        compare_price: 40.00,
        quantity: 28,
        description: "Ergonomic wireless mouse. Precise tracking. Long battery life.",
        sku: "MOUSE-WLS-001"
    },
    {
        name: "HDMI Cable",
        category: "electronics",
        condition: "new",
        price: 12.00,
        compare_price: 20.00,
        quantity: 45,
        description: "High-speed HDMI cable. Supports 4K resolution. 3-meter length.",
        sku: "CABLE-HDMI-001"
    },
    {
        name: "Phone Case",
        category: "electronics",
        condition: "new",
        price: 20.00,
        compare_price: 35.00,
        quantity: 35,
        description: "Protective phone case with cushioned corners. Premium material. Multiple color options.",
        sku: "CASE-PHONE-001"
    },
    {
        name: "Webcam HD",
        category: "electronics",
        condition: "new",
        price: 55.00,
        compare_price: 85.00,
        quantity: 9,
        description: "1080p HD webcam. Built-in microphone. Perfect for video calls and streaming.",
        sku: "CAM-WEB-001"
    },

    // Food & Beverages (8)
    {
        name: "Organic Coffee Beans",
        category: "food",
        condition: "new",
        price: 25.00,
        compare_price: 40.00,
        quantity: 30,
        description: "Premium organic coffee beans. Fresh roasted. Rich, smooth flavor. 500g pack.",
        sku: "COFFEE-ORG-001"
    },
    {
        name: "Green Tea Set",
        category: "food",
        condition: "new",
        price: 18.00,
        compare_price: 30.00,
        quantity: 24,
        description: "Organic green tea with natural flavor. Includes 20 tea bags. Healthy and refreshing.",
        sku: "TEA-GREEN-001"
    },
    {
        name: "Dark Chocolate Bar",
        category: "food",
        condition: "new",
        price: 8.00,
        compare_price: 12.00,
        quantity: 60,
        description: "Premium dark chocolate (70% cocoa). Rich taste. Perfect gift or treat.",
        sku: "CHOCO-DRK-001"
    },
    {
        name: "Honey Jar",
        category: "food",
        condition: "new",
        price: 15.00,
        compare_price: 24.00,
        quantity: 28,
        description: "Pure raw honey. Unfiltered and unpasteurized. 500ml jar. Natural sweetener.",
        sku: "HONEY-RAW-001"
    },
    {
        name: "Granola Cereal",
        category: "food",
        condition: "new",
        price: 12.00,
        compare_price: 18.00,
        quantity: 35,
        description: "Healthy granola with oats, nuts, and dried fruits. Nutritious breakfast option. 400g pack.",
        sku: "CEREAL-GRN-001"
    },
    {
        name: "Almond Butter",
        category: "food",
        condition: "new",
        price: 20.00,
        compare_price: 32.00,
        quantity: 22,
        description: "Creamy almond butter. No added sugar. Rich in protein. 300g jar.",
        sku: "BUTTER-ALM-001"
    },
    {
        name: "Herbal Tea Blend",
        category: "food",
        condition: "new",
        price: 14.00,
        compare_price: 22.00,
        quantity: 26,
        description: "Soothing herbal tea blend. Chamomile, lavender, and mint. 25 tea bags.",
        sku: "TEA-HERB-001"
    },
    {
        name: "Organic Peanuts",
        category: "food",
        condition: "new",
        price: 16.00,
        compare_price: 25.00,
        quantity: 32,
        description: "Roasted organic peanuts. No salt added. Perfect snack. 500g bag.",
        sku: "NUTS-PEA-001"
    },

    // Beauty & Cosmetics (6)
    {
        name: "Face Moisturizer",
        category: "beauty",
        condition: "new",
        price: 30.00,
        compare_price: 50.00,
        quantity: 19,
        description: "Hydrating face moisturizer. Suitable for all skin types. SPF 15 protection. 50ml.",
        sku: "BEAUTY-MOIST-001"
    },
    {
        name: "Lipstick Matte",
        category: "beauty",
        condition: "new",
        price: 18.00,
        compare_price: 28.00,
        quantity: 27,
        description: "Matte finish lipstick. Long-lasting color. Multiple shades available.",
        sku: "BEAUTY-LIP-001"
    },
    {
        name: "Shampoo Bottle",
        category: "beauty",
        condition: "new",
        price: 12.00,
        compare_price: 18.00,
        quantity: 33,
        description: "Sulfate-free shampoo. Suitable for all hair types. 250ml bottle.",
        sku: "BEAUTY-SHAM-001"
    },
    {
        name: "Face Mask",
        category: "beauty",
        condition: "new",
        price: 22.00,
        compare_price: 35.00,
        quantity: 21,
        description: "Hydrating face mask. Clay-based formula. Reduces impurities. 100ml.",
        sku: "BEAUTY-MASK-001"
    },
    {
        name: "Eye Cream",
        category: "beauty",
        condition: "new",
        price: 35.00,
        compare_price: 55.00,
        quantity: 13,
        description: "Anti-aging eye cream. Reduces wrinkles and puffiness. 15ml.",
        sku: "BEAUTY-EYE-001"
    },
    {
        name: "Perfume Spray",
        category: "beauty",
        condition: "new",
        price: 50.00,
        compare_price: 80.00,
        quantity: 10,
        description: "Luxury perfume spray. Long-lasting fragrance. 50ml bottle.",
        sku: "BEAUTY-PERF-001"
    },

    // Home & Living (6)
    {
        name: "Pillow Cover Set",
        category: "home",
        condition: "new",
        price: 28.00,
        compare_price: 45.00,
        quantity: 20,
        description: "Set of 2 pillow covers. Soft cotton blend. Machine washable. Multiple colors.",
        sku: "HOME-PILLOW-001"
    },
    {
        name: "Kitchen Knife Set",
        category: "home",
        condition: "new",
        price: 45.00,
        compare_price: 70.00,
        quantity: 14,
        description: "5-piece kitchen knife set. Stainless steel blades. Ergonomic handles.",
        sku: "HOME-KNIFE-001"
    },
    {
        name: "Coffee Mug",
        category: "home",
        condition: "new",
        price: 10.00,
        compare_price: 16.00,
        quantity: 50,
        description: "Ceramic coffee mug. Heat-resistant. Dishwasher safe. 350ml capacity.",
        sku: "HOME-MUG-001"
    },
    {
        name: "Table Lamp",
        category: "home",
        condition: "new",
        price: 40.00,
        compare_price: 65.00,
        quantity: 15,
        description: "Decorative table lamp. Adjustable brightness. Modern design.",
        sku: "HOME-LAMP-001"
    },
    {
        name: "Bed Sheet Set",
        category: "home",
        condition: "new",
        price: 55.00,
        compare_price: 85.00,
        quantity: 12,
        description: "100% cotton bed sheet set. Queen size. Soft and durable. Multiple colors.",
        sku: "HOME-SHEET-001"
    },
    {
        name: "Wall Clock",
        category: "home",
        condition: "new",
        price: 18.00,
        compare_price: 30.00,
        quantity: 25,
        description: "Modern wall clock. Silent movement. Stylish design. Easy to hang.",
        sku: "HOME-CLOCK-001"
    }
];

// Function to generate a simple image placeholder URL
function generateImageUrl(productName, index) {
    // Using placeholder image service with product name
    const encodedName = encodeURIComponent(productName);
    return `https://picsum.photos/400/400?random=${index}`;
}

// Function to create products in Supabase
async function createProducts() {
    try {
        console.log('Starting product creation...');

        // Wait for Supabase to be available
        if (!window.supabase) {
            console.error('Supabase not available');
            return;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('No user logged in');
            alert('Please login first');
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        // Create products with batches to avoid rate limiting
        for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
            const product = SAMPLE_PRODUCTS[i];

            try {
                // Create product data with image
                const productData = {
                    seller_id: user.id,
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    condition: product.condition,
                    price: product.price,
                    compare_price: product.compare_price,
                    quantity: product.quantity,
                    sku: product.sku,
                    images: [generateImageUrl(product.name, i)],
                    status: 'active'
                };

                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select()
                    .single();

                if (error) {
                    console.error(`Error creating product ${i + 1}:`, error);
                    errorCount++;
                } else {
                    console.log(`Created product ${i + 1}: ${product.name}`);
                    successCount++;
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`Exception creating product ${i + 1}:`, err);
                errorCount++;
            }
        }

        alert(`✓ Product Creation Complete!\n\nSuccessful: ${successCount}\nFailed: ${errorCount}`);
        console.log(`Completed: ${successCount} created, ${errorCount} failed`);

        // Update navigation counts
        if (window.updateNavigationCounts) {
            await window.updateNavigationCounts();
        }

    } catch (error) {
        console.error('Error in product creation:', error);
        alert('Error creating products: ' + error.message);
    }
}

// Export function for use in other scripts
window.createProducts = createProducts;

console.log('Products generator loaded. Call createProducts() to create 40 sample products.');
