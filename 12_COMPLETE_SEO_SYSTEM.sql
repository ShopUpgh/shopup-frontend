-- ============================================
-- SHOPUP™ COMPLETE SEO SYSTEM
-- ============================================
-- Technical SEO, Meta Tags, Schema Markup
-- Sitemaps, Analytics, Performance Tracking
-- Powered by The House of Alden's Holdings
-- Version: 1.0 - Ghana Domination Edition
-- ============================================

-- ============================================
-- 1. SEO META TAGS (Per Page)
-- ============================================

CREATE TABLE IF NOT EXISTS seo_meta_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Page Reference
    page_type VARCHAR(50) NOT NULL CHECK (
        page_type IN ('homepage', 'category', 'product', 'city_landing', 'blog', 'static')
    ),
    page_id UUID, -- Reference to products/categories/blog posts
    
    -- URL Management
    canonical_url TEXT NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL,
    
    -- Meta Tags (CRITICAL for rankings)
    meta_title VARCHAR(60) NOT NULL, -- 50-60 chars optimal
    meta_description VARCHAR(160) NOT NULL, -- 150-160 chars optimal
    meta_keywords TEXT, -- Legacy but useful for internal tracking
    
    -- Open Graph (Facebook/WhatsApp)
    og_title VARCHAR(60),
    og_description VARCHAR(160),
    og_image TEXT,
    og_type VARCHAR(50) DEFAULT 'website',
    
    -- Twitter Cards
    twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
    twitter_title VARCHAR(60),
    twitter_description VARCHAR(160),
    twitter_image TEXT,
    
    -- Advanced SEO
    robots_meta VARCHAR(100) DEFAULT 'index, follow',
    
    -- Location (Ghana-specific)
    target_city VARCHAR(100), -- 'Accra', 'Kumasi', 'Tema', etc.
    target_region VARCHAR(100), -- 'Greater Accra', 'Ashanti', etc.
    geo_position VARCHAR(50), -- Lat,Long for local SEO
    
    -- Performance
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seo_meta_page_type ON seo_meta_tags(page_type);
CREATE INDEX idx_seo_meta_slug ON seo_meta_tags(slug);
CREATE INDEX idx_seo_meta_city ON seo_meta_tags(target_city);

-- ============================================
-- 2. SCHEMA MARKUP (Structured Data)
-- ============================================

CREATE TABLE IF NOT EXISTS schema_markup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Page Reference
    page_type VARCHAR(50) NOT NULL,
    page_id UUID,
    
    -- Schema Type
    schema_type VARCHAR(50) NOT NULL CHECK (
        schema_type IN (
            'Product', 'Organization', 'WebSite', 'BreadcrumbList',
            'AggregateRating', 'Review', 'Offer', 'LocalBusiness',
            'FAQPage', 'HowTo', 'Article'
        )
    ),
    
    -- JSON-LD Data
    schema_json JSONB NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    validated BOOLEAN DEFAULT false,
    validation_errors TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schema_page_id ON schema_markup(page_id);
CREATE INDEX idx_schema_type ON schema_markup(schema_type);

-- ============================================
-- 3. URL MANAGEMENT & REDIRECTS
-- ============================================

CREATE TABLE IF NOT EXISTS url_redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source & Target
    from_url TEXT NOT NULL,
    to_url TEXT NOT NULL,
    
    -- Redirect Type
    redirect_type INTEGER DEFAULT 301 CHECK (redirect_type IN (301, 302, 307, 308)),
    
    -- Reason
    reason TEXT,
    
    -- Tracking
    hit_count INTEGER DEFAULT 0,
    last_hit TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_redirects_from ON url_redirects(from_url);
CREATE INDEX idx_redirects_active ON url_redirects(is_active) WHERE is_active = true;

-- ============================================
-- 4. SITEMAP GENERATION
-- ============================================

CREATE TABLE IF NOT EXISTS sitemap_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- URL Details
    url TEXT NOT NULL UNIQUE,
    page_type VARCHAR(50) NOT NULL,
    page_id UUID,
    
    -- Sitemap Properties
    priority DECIMAL(2,1) DEFAULT 0.5 CHECK (priority >= 0 AND priority <= 1.0),
    changefreq VARCHAR(20) DEFAULT 'weekly' CHECK (
        changefreq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')
    ),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Images (for image sitemap)
    images JSONB, -- Array of {url, title, caption}
    
    -- Status
    include_in_sitemap BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sitemap_priority ON sitemap_urls(priority DESC);
CREATE INDEX idx_sitemap_type ON sitemap_urls(page_type);
CREATE INDEX idx_sitemap_active ON sitemap_urls(is_active, include_in_sitemap);

-- ============================================
-- 5. KEYWORD TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS seo_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Keyword Details
    keyword TEXT NOT NULL,
    keyword_type VARCHAR(50) NOT NULL CHECK (
        keyword_type IN ('primary', 'secondary', 'long_tail', 'local', 'branded')
    ),
    
    -- Targeting
    target_page_type VARCHAR(50),
    target_page_id UUID,
    target_url TEXT,
    
    -- Location
    target_city VARCHAR(100), -- 'Accra', 'Kumasi', etc.
    target_country VARCHAR(50) DEFAULT 'Ghana',
    
    -- Search Intent
    search_intent VARCHAR(50) CHECK (
        search_intent IN ('informational', 'navigational', 'transactional', 'commercial')
    ),
    
    -- Metrics
    monthly_searches INTEGER,
    competition_level VARCHAR(20), -- 'low', 'medium', 'high'
    current_ranking INTEGER,
    target_ranking INTEGER DEFAULT 3,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_checked TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_keywords_type ON seo_keywords(keyword_type);
CREATE INDEX idx_keywords_city ON seo_keywords(target_city);
CREATE INDEX idx_keywords_ranking ON seo_keywords(current_ranking);

-- ============================================
-- 6. BACKLINK TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS backlinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source Details
    source_domain VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    source_page_title VARCHAR(255),
    
    -- Target
    target_url TEXT NOT NULL,
    
    -- Link Properties
    anchor_text TEXT,
    link_type VARCHAR(50) CHECK (link_type IN ('dofollow', 'nofollow', 'ugc', 'sponsored')),
    link_placement VARCHAR(50), -- 'content', 'sidebar', 'footer', 'navigation'
    
    -- Metrics
    domain_authority INTEGER,
    page_authority INTEGER,
    trust_score DECIMAL(3,2),
    
    -- Discovery
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discovered_method VARCHAR(50), -- 'manual', 'ahrefs', 'google_search_console'
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'lost', 'pending', 'broken')),
    last_checked TIMESTAMP WITH TIME ZONE,
    
    -- Contact
    contact_email VARCHAR(255),
    contact_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_backlinks_domain ON backlinks(source_domain);
CREATE INDEX idx_backlinks_status ON backlinks(status);
CREATE INDEX idx_backlinks_target ON backlinks(target_url);

-- ============================================
-- 7. GHANA CITY LANDING PAGES
-- ============================================

CREATE TABLE IF NOT EXISTS city_landing_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- City Details
    city_name VARCHAR(100) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    
    -- SEO Content
    page_title VARCHAR(255) NOT NULL,
    meta_description TEXT NOT NULL,
    h1_heading VARCHAR(255) NOT NULL,
    
    -- Content
    intro_text TEXT NOT NULL,
    delivery_info TEXT,
    popular_products JSONB, -- Array of product IDs
    
    -- Location
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    postal_codes TEXT[],
    digital_addresses TEXT[], -- Ghana Post GPS
    
    -- Metrics
    population INTEGER,
    ecommerce_potential VARCHAR(20), -- 'high', 'medium', 'low'
    
    -- Performance
    page_views INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    publish_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert major Ghana cities
INSERT INTO city_landing_pages (city_name, region, slug, page_title, meta_description, h1_heading, intro_text, latitude, longitude, ecommerce_potential) VALUES
    (
        'Accra',
        'Greater Accra',
        'accra',
        'Buy Phones, Electronics & More in Accra - Fast Delivery | ShopUp™',
        'Shop the best deals in Accra, Ghana. Fast same-day delivery, 100% authentic products. Buy phones, electronics, appliances & more. Pay on delivery available.',
        'Shop Online in Accra - Ghana''s Fastest Delivery',
        'Welcome to ShopUp Accra! We offer same-day delivery across Greater Accra, from East Legon to Dansoman, Tema to Kasoa. Shop phones, electronics, home appliances, fashion & more with secure payments and pay on delivery.',
        5.6037,
        -0.1870,
        'high'
    ),
    (
        'Kumasi',
        'Ashanti',
        'kumasi',
        'Buy Online in Kumasi - Next-Day Delivery | ShopUp™',
        'Shop online in Kumasi with next-day delivery. Authentic phones, electronics, appliances. Best prices in Ashanti Region. Pay on delivery available.',
        'Shop Online in Kumasi - Ashanti''s Best Deals',
        'ShopUp Kumasi brings you the best online shopping experience in Ashanti Region. Next-day delivery to all areas including Adum, Asokwa, Bantama, and beyond.',
        6.6885,
        -1.6244,
        'high'
    ),
    (
        'Tema',
        'Greater Accra',
        'tema',
        'Online Shopping Tema - Fast Delivery | ShopUp™',
        'Shop online in Tema, Ghana. Fast delivery, authentic products, best prices. Phones, electronics, appliances & more. Pay on delivery.',
        'Shop Online in Tema - Fast & Reliable',
        'ShopUp delivers to all Tema communities - Community 1 to 25, Sakumono, Spintex. Same-day delivery available.',
        5.6698,
        -0.0166,
        'medium'
    ),
    (
        'Takoradi',
        'Western',
        'takoradi',
        'Buy Online in Takoradi - ShopUp™ Ghana',
        'Online shopping in Takoradi with reliable delivery. Phones, electronics, home appliances. Best deals in Western Region.',
        'Shop Online in Takoradi - Western Region''s Best',
        'ShopUp serves Takoradi and all Western Region. Fast delivery to Takoradi, Sekondi, Effiakuma, and surrounding areas.',
        4.8845,
        -1.7554,
        'medium'
    ),
    (
        'Cape Coast',
        'Central',
        'cape-coast',
        'Online Shopping Cape Coast - ShopUp™',
        'Buy phones, electronics & more in Cape Coast. Fast delivery across Central Region. Best prices, authentic products.',
        'Shop Online in Cape Coast',
        'ShopUp delivers to Cape Coast and all Central Region cities. Quality products, fast delivery, secure payments.',
        5.1053,
        -1.2466,
        'medium'
    ),
    (
        'Tamale',
        'Northern',
        'tamale',
        'Buy Online in Tamale - ShopUp™ Ghana',
        'Online shopping in Tamale with delivery across Northern Region. Phones, electronics, appliances at best prices.',
        'Shop Online in Tamale - Northern Ghana',
        'ShopUp brings online shopping to Tamale and Northern Region. Fast delivery, authentic products, great prices.',
        9.4034,
        -0.8424,
        'medium'
    )
ON CONFLICT (city_name) DO NOTHING;

CREATE INDEX idx_city_pages_slug ON city_landing_pages(slug);
CREATE INDEX idx_city_pages_region ON city_landing_pages(region);

-- ============================================
-- 8. BLOG/CONTENT MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    
    -- SEO
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    focus_keyword VARCHAR(255),
    
    -- Author
    author_id UUID REFERENCES auth.users(id),
    
    -- Category
    category VARCHAR(100), -- 'buying-guides', 'news', 'tips', etc.
    
    -- Featured
    featured_image TEXT,
    is_featured BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
    publish_date TIMESTAMP WITH TIME ZONE,
    
    -- Metrics
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_status ON blog_posts(status);
CREATE INDEX idx_blog_category ON blog_posts(category);

-- ============================================
-- 9. PAGE PERFORMANCE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS page_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Page
    url TEXT NOT NULL,
    page_type VARCHAR(50),
    
    -- Core Web Vitals
    lcp_score DECIMAL(6,2), -- Largest Contentful Paint (ms)
    fid_score DECIMAL(6,2), -- First Input Delay (ms)
    cls_score DECIMAL(4,3), -- Cumulative Layout Shift
    
    -- Speed Metrics
    load_time_mobile DECIMAL(6,2), -- seconds
    load_time_desktop DECIMAL(6,2),
    
    -- PageSpeed Insights Scores
    mobile_score INTEGER,
    desktop_score INTEGER,
    
    -- Date
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_url ON page_performance(url);
CREATE INDEX idx_performance_date ON page_performance(measured_at DESC);

-- ============================================
-- 10. ANALYTICS INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    
    -- Page
    page_url TEXT,
    page_title VARCHAR(255),
    
    -- User
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    
    -- Location
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Ghana',
    
    -- Device
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Search
    search_query TEXT,
    search_results_count INTEGER,
    
    -- Custom Data
    event_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_event ON analytics_events(event_name);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_date ON analytics_events(created_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate product schema markup
CREATE OR REPLACE FUNCTION generate_product_schema(p_product_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_product RECORD;
    v_schema JSONB;
BEGIN
    SELECT 
        p.id,
        p.product_name,
        p.description,
        p.price,
        p.image_url,
        p.stock_quantity,
        p.average_rating,
        p.review_count,
        pc.name as category_name,
        u.business_name as seller_name
    INTO v_product
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.id = p_product_id;
    
    v_schema := jsonb_build_object(
        '@context', 'https://schema.org/',
        '@type', 'Product',
        'name', v_product.product_name,
        'description', v_product.description,
        'image', v_product.image_url,
        'brand', jsonb_build_object(
            '@type', 'Brand',
            'name', v_product.seller_name
        ),
        'offers', jsonb_build_object(
            '@type', 'Offer',
            'url', 'https://shopup.gh/products/' || p_product_id,
            'priceCurrency', 'GHS',
            'price', v_product.price,
            'availability', CASE 
                WHEN v_product.stock_quantity > 0 THEN 'https://schema.org/InStock'
                ELSE 'https://schema.org/OutOfStock'
            END,
            'seller', jsonb_build_object(
                '@type', 'Organization',
                'name', 'ShopUp Ghana'
            )
        ),
        'aggregateRating', CASE
            WHEN v_product.review_count > 0 THEN
                jsonb_build_object(
                    '@type', 'AggregateRating',
                    'ratingValue', v_product.average_rating,
                    'reviewCount', v_product.review_count
                )
            ELSE NULL
        END
    );
    
    RETURN v_schema;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate SEO meta tags for products
CREATE OR REPLACE FUNCTION auto_generate_product_meta()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_title VARCHAR(60);
    v_meta_desc VARCHAR(160);
BEGIN
    -- Generate meta title
    v_meta_title := LEFT(NEW.product_name || ' - Price in Ghana - ShopUp™', 60);
    
    -- Generate meta description
    v_meta_desc := LEFT(
        'Buy ' || NEW.product_name || ' at the best price in Ghana. ' ||
        'Fast delivery to Accra & Kumasi. 100% authentic. Order now at ShopUp.',
        160
    );
    
    -- Insert or update meta tags
    INSERT INTO seo_meta_tags (
        page_type,
        page_id,
        canonical_url,
        slug,
        meta_title,
        meta_description,
        og_title,
        og_description,
        og_image,
        twitter_title,
        twitter_description,
        twitter_image
    ) VALUES (
        'product',
        NEW.id,
        'https://shopup.gh/products/' || NEW.id,
        NEW.product_name, -- Will be slugified in frontend
        v_meta_title,
        v_meta_desc,
        v_meta_title,
        v_meta_desc,
        NEW.image_url,
        v_meta_title,
        v_meta_desc,
        NEW.image_url
    )
    ON CONFLICT (canonical_url) DO UPDATE SET
        meta_title = v_meta_title,
        meta_description = v_meta_desc,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_product_meta ON products;
CREATE TRIGGER trigger_auto_product_meta
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_product_meta();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Public can read SEO meta tags
ALTER TABLE seo_meta_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read SEO meta" ON seo_meta_tags FOR SELECT USING (true);

-- Public can read schema markup
ALTER TABLE schema_markup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read schema" ON schema_markup FOR SELECT USING (true);

-- Public can read blog posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published blogs" ON blog_posts FOR SELECT 
USING (status = 'published');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ ShopUp SEO System Complete!';
    RAISE NOTICE '🎯 Meta Tags Management';
    RAISE NOTICE '📊 Schema Markup (JSON-LD)';
    RAISE NOTICE '🗺️  Sitemap Generation';
    RAISE NOTICE '🔑 Keyword Tracking';
    RAISE NOTICE '🔗 Backlink Management';
    RAISE NOTICE '🇬🇭 Ghana City Landing Pages (6 cities)';
    RAISE NOTICE '✍️  Blog/Content System';
    RAISE NOTICE '⚡ Performance Tracking';
    RAISE NOTICE '📈 Analytics Integration';
    RAISE NOTICE '';
    RAISE NOTICE '🏆 Ready to Dominate Ghana SEO!';
END $$;
