/**
 * ShopUp Ghana - SEO Meta Tag Generator
 * Dynamically generates and updates SEO meta tags for products and pages
 */

class SEOMetaGenerator {
  constructor() {
    this.siteName = 'ShopUp Ghana';
    this.domain = 'https://shopup.gh';
  }
  
  /**
   * Generate product page meta tags
   * @param {Object} product - Product object with name, price, description, image, etc.
   */
  generateProductMeta(product) {
    const title = `${product.name} - Price in Ghana | ${this.siteName}`;
    const description = `Buy ${product.name} at GH₵ ${product.price} in Ghana. ${product.description ? product.description.substring(0, 100) : 'Quality product'}... Fast delivery to Accra, Kumasi. 100% authentic. Order now!`;
    
    // Set title
    document.title = title;
    
    // Set meta description
    this.setMetaTag('description', description);
    
    // Set Open Graph tags
    this.setMetaTag('og:title', title, 'property');
    this.setMetaTag('og:description', description, 'property');
    this.setMetaTag('og:image', product.image_url || `${this.domain}/images/default-product.jpg`, 'property');
    this.setMetaTag('og:url', `${this.domain}/products/${product.id}`, 'property');
    this.setMetaTag('og:type', 'product', 'property');
    
    // Set Twitter tags
    this.setMetaTag('twitter:title', title, 'property');
    this.setMetaTag('twitter:description', description, 'property');
    this.setMetaTag('twitter:image', product.image_url || `${this.domain}/images/default-product.jpg`, 'property');
    this.setMetaTag('twitter:card', 'summary_large_image', 'property');
    
    // Set canonical URL
    this.setCanonical(`${this.domain}/products/${product.id}`);
  }
  
  /**
   * Generate category page meta tags
   * @param {Object} category - Category object with name, slug, etc.
   */
  generateCategoryMeta(category) {
    const title = `Buy ${category.name} in Ghana - Best Prices | ${this.siteName}`;
    const description = `Shop ${category.name} at the best prices in Ghana. Fast delivery to Accra, Kumasi & all cities. 100% authentic products. Browse now!`;
    
    document.title = title;
    this.setMetaTag('description', description);
    this.setMetaTag('og:title', title, 'property');
    this.setMetaTag('og:description', description, 'property');
    this.setCanonical(`${this.domain}/${category.slug}`);
  }
  
  /**
   * Set or update a meta tag
   * @param {string} name - Meta tag name or property
   * @param {string} content - Content value
   * @param {string} attribute - Attribute type (name or property)
   */
  setMetaTag(name, content, attribute = 'name') {
    let meta = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
  
  /**
   * Set canonical URL
   * @param {string} url - Canonical URL
   */
  setCanonical(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }
  
  /**
   * Generate Product structured data (Schema.org)
   * @param {Object} product - Product object
   */
  generateProductSchema(product) {
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": [product.image_url],
      "description": product.description || `${product.name} available in Ghana`,
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": product.brand || this.siteName
      },
      "offers": {
        "@type": "Offer",
        "url": `${this.domain}/products/${product.id}`,
        "priceCurrency": "GHS",
        "price": product.price,
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": this.siteName
        }
      }
    };
    
    // Add reviews if available
    if (product.reviews && product.reviews.length > 0) {
      const avgRating = product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length;
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": avgRating.toFixed(1),
        "reviewCount": product.reviews.length
      };
    }
    
    this.injectSchema(schema);
  }
  
  /**
   * Inject schema markup into page
   * @param {Object} schema - Schema.org JSON-LD object
   */
  injectSchema(schema) {
    // Remove existing product schema if any
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-schema="product"]');
    if (existingSchema) {
      existingSchema.remove();
    }
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'product');
    script.text = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  }
}

// Usage example:
// const seoGenerator = new SEOMetaGenerator();
// 
// When you load a product:
// seoGenerator.generateProductMeta(product);
// seoGenerator.generateProductSchema(product);
//
// When you load a category:
// seoGenerator.generateCategoryMeta(category);
