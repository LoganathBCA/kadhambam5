// src/pages/ProductDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import { getProduct } from '../services/productService';
import { useCart } from '../context/CartContext';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

const TABS = ['Details', 'Nutrition', 'Origin'];

const ProductDetailPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('Details');

  useEffect(() => {
    getProduct(id)
      .then((p) => {
        setProduct(p);
        // Auto-select the middle variant or first
        const basePrice = Number(p.price) || 0;
        const vars = Array.isArray(p.variants) && p.variants.length > 0
          ? p.variants
          : p.pricingType === 'count'
            ? [
                { label: '1 pc',   price: basePrice },
                { label: '6 pcs',  price: Math.round(basePrice * 5.5) },
                { label: '12 pcs', price: Math.round(basePrice * 10) },
              ]
            : [
                { label: '250g', price: Math.round(basePrice * 0.5) },
                { label: '500g', price: basePrice },
                { label: '1kg',  price: Math.round(basePrice * 1.85) },
              ];
        setSelectedVariant(vars[1] || vars[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page-body-pad">
      <Header />
      <div className="loading-spinner"><div className="spinner" /></div>
      <MobileNav />
    </div>
  );

  if (!product) return (
    <div className="page-body-pad">
      <Header />
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <p>Product not found.</p>
        <Link to="/shop" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Back to Shop
        </Link>
      </div>
      <MobileNav />
    </div>
  );

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    for (let i = 0; i < qty; i++) addToCart(product, selectedVariant.label, selectedVariant.price);
    toast.success(
      qty > 1
        ? `${qty}× ${product.name} (${selectedVariant.label}) added!`
        : `${product.name} (${selectedVariant.label}) added to cart!`,
      { icon: '🛒', duration: 2000 }
    );
  };

  // Generate dynamic Schema.org JSON-LD for the product
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description || 'Premium quality, carefully hand-selected and packaged to preserve maximum freshness and nutritional value.',
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'INR',
      price: selectedVariant?.price || product.price,
      availability: 'https://schema.org/InStock',
    },
    brand: {
      '@type': 'Brand',
      name: 'Kadhambam',
    },
  };

  return (
    <div className="page-body-pad">
      <Helmet>
        <title>{product.name} | Kadhambam</title>
        <meta name="description" content={product.description || `Buy premium quality ${product.name} at Kadhambam. Carefully hand-selected for maximum freshness.`} />
        
        {/* OpenGraph tags for social sharing */}
        <meta property="og:title" content={`${product.name} | Kadhambam`} />
        <meta property="og:description" content={product.description || `Buy premium quality ${product.name} at Kadhambam.`} />
        {product.image && <meta property="og:image" content={product.image} />}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Structured data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      
      <Header />
      <main id="main-content" style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: 'var(--space-10) var(--margin-mobile)' }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 32 }}>
          <ol style={{ display: 'flex', alignItems: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link to="/" style={{ color: 'inherit' }}>Home</Link></li>
            <li aria-hidden="true"><span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14 }}>chevron_right</span></li>
            <li><Link to="/shop" style={{ color: 'inherit' }}>Shop</Link></li>
            <li aria-hidden="true"><span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14 }}>chevron_right</span></li>
            <li><span aria-current="page" style={{ color: 'var(--color-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{product.name}</span></li>
          </ol>
        </nav>

        {/* Layout: image + info side by side on md+, tabs below */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'start' }}>
              {/* Product image */}
              <div style={{
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                aspectRatio: '4/5',
                background: 'var(--color-surface-container-low)',
                boxShadow: 'var(--shadow-card-hover)',
              }}>
                <img
                  src={product.image || `https://placehold.co/600x750/fdecd1/2f4d2e?text=${encodeURIComponent(product.name)}`}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Product info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
                {product.badge && (
                  <span className={`badge ${product.badge === 'Organic' ? 'badge-organic' : 'badge-bestseller'}`}
                    style={{ alignSelf: 'flex-start' }}>
                    {product.badge}
                  </span>
                )}
                <h1 className="text-headline-lg" style={{ color: 'var(--color-primary)' }}>{product.name}</h1>
                {product.tagline && (
                  <p style={{ fontStyle: 'italic', color: 'var(--color-on-surface-variant)', fontSize: 16 }}>{product.tagline}</p>
                )}
                <p style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--color-primary)' }}>
                  ₹{selectedVariant
                    ? Number(selectedVariant.price).toLocaleString('en-IN')
                    : (typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price)
                  }
                </p>

                {/* Variant selector */}
                {(() => {
                  const basePrice = Number(product.price) || 0;
                  const vars = Array.isArray(product.variants) && product.variants.length > 0
                    ? product.variants
                    : product.pricingType === 'count'
                      ? [
                          { label: '1 pc',   price: basePrice },
                          { label: '6 pcs',  price: Math.round(basePrice * 5.5) },
                          { label: '12 pcs', price: Math.round(basePrice * 10) },
                        ]
                      : [
                          { label: '250g', price: Math.round(basePrice * 0.5) },
                          { label: '500g', price: basePrice },
                          { label: '1kg',  price: Math.round(basePrice * 1.85) },
                        ];
                  return (
                    <div>
                      <p className="label" style={{ marginBottom: 10 }}>
                        {product.pricingType === 'count' ? 'Select Quantity Pack' : 'Select Weight'}
                      </p>
                      <div className="weight-selector">
                        {vars.map((v) => (
                          <button
                            key={v.label}
                            className={`weight-btn${selectedVariant?.label === v.label ? ' active' : ''}`}
                            onClick={() => setSelectedVariant(v)}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Qty stepper */}
                <div>
                  <p className="label" id="qty-label" style={{ marginBottom: 10 }}>Quantity</p>
                  <div className="qty-controls" role="group" aria-labelledby="qty-label">
                    <button
                      className="qty-btn"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      aria-label={`Decrease quantity, currently ${qty}`}
                      disabled={qty <= 1}
                    >
                      −
                    </button>
                    <span
                      className="qty-value"
                      aria-live="polite"
                      aria-atomic="true"
                      aria-label={`Quantity: ${qty}`}
                    >
                      {qty}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => setQty(qty + 1)}
                      aria-label={`Increase quantity, currently ${qty}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to cart */}
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleAddToCart}>
                  <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 20 }}>shopping_cart</span>
                  Add to Cart ₹{((selectedVariant?.price || product.price || 0) * qty).toLocaleString('en-IN')}
                </button>

                {/* Highlights */}
                <div className="product-highlights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                  {[
                    { icon: 'eco', text: 'Sustainably Sourced' },
                    { icon: 'verified', text: 'Quality Tested' },
                    { icon: 'local_shipping', text: 'Fast Delivery' },
                    { icon: 'lock', text: 'Secure Checkout' },
                  ].map((h) => (
                    <div key={h.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18, color: 'var(--color-primary)' }}>{h.icon}</span>
                      {h.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div
                role="tablist"
                aria-label="Product information"
                style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)', marginBottom: 24 }}
              >
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    id={`tab-${tab.toLowerCase()}`}
                    aria-selected={activeTab === tab}
                    aria-controls={`tabpanel-${tab.toLowerCase()}`}
                    onClick={() => setActiveTab(tab)}
                    tabIndex={activeTab === tab ? 0 : -1}
                    onKeyDown={(e) => {
                      const idx = TABS.indexOf(activeTab);
                      if (e.key === 'ArrowRight') { setActiveTab(TABS[(idx + 1) % TABS.length]); }
                      if (e.key === 'ArrowLeft')  { setActiveTab(TABS[(idx - 1 + TABS.length) % TABS.length]); }
                    }}
                    style={{
                      padding: '12px 24px',
                      fontSize: 14, fontWeight: 600,
                      color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                      borderBottom: `2px solid ${activeTab === tab ? 'var(--color-primary)' : 'transparent'}`,
                      transition: 'all 150ms',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {TABS.map((tab) => (
                <div
                  key={tab}
                  role="tabpanel"
                  id={`tabpanel-${tab.toLowerCase()}`}
                  aria-labelledby={`tab-${tab.toLowerCase()}`}
                  hidden={activeTab !== tab}
                  tabIndex={0}
                  style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.8, fontSize: 15 }}
                >
                  {tab === 'Details' && (
                    <p>{product.description || 'Premium quality, carefully hand-selected and packaged to preserve maximum freshness and nutritional value.'}</p>
                  )}
                  {tab === 'Nutrition' && (
                    <p>Rich in essential vitamins, minerals, and healthy fats. Consult the packaging for detailed nutritional information per 100g serving.</p>
                  )}
                  {tab === 'Origin' && (
                    <p>Sourced directly from trusted farms across Tamil Nadu and neighbouring regions. Our supply chain is transparent, ethical, and committed to sustainable farming practices.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      <Footer />
      <MobileNav />

      {/* Sticky mobile Add to Cart bar */}
      <div className="sticky-atc-bar" role="complementary" aria-label="Quick add to cart">
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 14, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
            ₹{((selectedVariant?.price || product.price || 0) * qty).toLocaleString('en-IN')} · {selectedVariant?.label || ''}
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ flexShrink: 0, padding: '10px 20px' }}
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} ${selectedVariant?.label || ''} to cart ₹${((selectedVariant?.price || product.price || 0) * qty).toLocaleString('en-IN')}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18 }}>shopping_cart</span>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetailPage;
