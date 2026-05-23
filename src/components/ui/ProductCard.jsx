// src/components/ui/ProductCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
const OptimizedImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  const fallbackSrc = `https://placehold.co/400x500/fdecd1/2f4d2e?text=${encodeURIComponent(alt)}`;
  const imgSrc = error ? fallbackSrc : (src || fallbackSrc);

  // For Firebase Storage URLs, try to get a WebP version via URL params
  // (Firebase Storage serves images as-is, but we can still use <picture> for local assets)
  const isFirebase = imgSrc.includes('firebasestorage.googleapis.com');
  const webpSrc = isFirebase
    ? null   // Firebase Storage doesn't transcode on-the-fly
    : imgSrc.endsWith('.jpg') || imgSrc.endsWith('.jpeg') || imgSrc.endsWith('.png')
      ? imgSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* LQIP — visible while real image loads */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--color-surface-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{
            fontFamily: 'Material Symbols Outlined', fontSize: 40,
            color: 'var(--color-outline-variant)',
            fontVariationSettings: "'FILL' 0, 'wght' 200",
            animation: 'pulse-slow 1.8s ease-in-out infinite',
          }}>
            nutrition
          </span>
        </div>
      )}

      {/* Real image — fade in on load */}
      {webpSrc ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            src={imgSrc}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true); }}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 400ms ease, transform 600ms cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          />
        </picture>
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 400ms ease, transform 600ms cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        />
      )}
    </div>
  );
};



const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  // Use product variants (from admin) or fallback defaults based on pricingType
  const variants = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants
    : product.pricingType === 'count'
      ? [{ label: '1 pc', price: product.price }, { label: '6 pcs', price: product.price }, { label: '12 pcs', price: product.price }]
      : [{ label: '250g', price: product.price }, { label: '500g', price: product.price }, { label: '1kg', price: product.price }];

  const [selectedVariant, setSelectedVariant] = useState(variants[1] || variants[0]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addToCart(product, selectedVariant.label, selectedVariant.price);
    toast.success(`Added to cart! 🛒`, {
      duration: 1800,
      style: { fontSize: 13 },
    });
    setTimeout(() => setAdding(false), 800);
  };



  const displayPrice = selectedVariant?.price
    ? Number(selectedVariant.price).toLocaleString('en-IN')
    : (typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price);

  return (
    <article className="product-card" aria-label={product.name}>
      {/* ── Image area ── */}
      <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="product-card__image-wrap">

          <OptimizedImage
            src={product.image}
            alt={product.name}
            className="product-card__image"
          />
        </div>
      </Link>

      {/* ── Body ── */}
      <div className="product-card__body">
        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className="text-headline-sm" style={{
            color: 'var(--color-primary)',
            marginBottom: 4,
            fontSize: 'clamp(13px, 3.5vw, 18px)',
            lineHeight: 1.3,
          }}>
            {product.name}
          </h3>
          {product.tagline && (
            <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--color-on-surface-variant)', marginBottom: 2 }}>
              {product.tagline}
            </p>
          )}
        </Link>

        {/* Variant selector */}
        <div
          className="weight-selector"
          role="group"
          aria-label="Select weight"
        >
          {variants.map((v) => (
            <button
              key={v.label}
              className={`weight-btn${selectedVariant?.label === v.label ? ' active' : ''}`}
              onClick={() => setSelectedVariant(v)}
              aria-pressed={selectedVariant?.label === v.label}
              aria-label={`${v.label} — ₹${Number(v.price).toLocaleString('en-IN')}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Price + Add button row */}
        <div className="product-card__meta">
          <div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 2 }}>
              {selectedVariant?.label}
            </span>
            <span className="product-card__price">
              ₹{displayPrice}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding}
            aria-label={`${adding ? 'Added' : 'Add'} ${product.name} ${selectedVariant?.label || ''} ₹${displayPrice} to cart`}
            aria-live="polite"
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #2a5c2a, #193619)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: adding ? 'default' : 'pointer',
              transition: 'all 180ms ease',
              boxShadow: adding ? '0 0 0 3px rgba(25,54,25,0.2)' : '0 3px 10px rgba(25,54,25,0.3)',
              transform: adding ? 'scale(0.9)' : 'scale(1)',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{
              fontFamily: 'Material Symbols Outlined',
              fontSize: 18,
              fontVariationSettings: adding ? "'FILL' 1" : "'FILL' 0",
            }}>
              {adding ? 'check' : 'add'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
