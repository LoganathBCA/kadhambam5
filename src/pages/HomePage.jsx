// src/pages/HomePage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import Carousel from '../components/ui/Carousel';
import OfferBar from '../components/ui/OfferBar';
import ProductCard from '../components/ui/ProductCard';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import toast from 'react-hot-toast';

const WhatsAppSVG = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── About section data ──────────────────────────────────────────────────────
const STATS = [
  { value: '100+', label: 'Varieties', icon: 'agriculture' },
  { value: '10K+', label: 'Happy Families', icon: 'groups' },
  { value: '100%', label: 'Natural', icon: 'eco' },
  { value: '0', label: 'Preservatives', icon: 'no_food' },
];

const VALUES = [
  { icon: 'eco', title: 'Sustainably Sourced', desc: 'Partnered with ethical farms committed to regenerative agriculture.' },
  { icon: 'verified', title: 'Quality Tested', desc: 'Every batch is lab-tested for purity, freshness, and safety.' },
  { icon: 'local_shipping', title: 'Farm to Doorstep', desc: 'Direct sourcing fresher products and fair wages for farmers.' },
  { icon: 'favorite', title: 'Made with Love', desc: 'Hand-selected, carefully packaged, and delivered with care.' },
];

// ─── Contact channels ────────────────────────────────────────────────────────
const CHANNELS = [
  { icon: 'call', label: 'Phone', value: '+91 88254 38334', href: 'tel:+918825438334', color: '#2a5c2a' },
  { icon: 'chat', label: 'WhatsApp', value: 'Chat Instantly', href: 'https://wa.me/918825438334', color: '#25d366' },
  { icon: 'mail', label: 'Email', value: 'kadhambamfoods@gmail.com', href: 'mailto:kadhambamfoods@gmail.com', color: '#7d5700' },
  { icon: 'location_on', label: 'Store', value: 'Dindigul – 624001', href: 'https://www.google.com/maps/place/Kadhambam+Dry+Fruits/@10.3631813,77.9722131,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00abf8e6696dcb:0x24a7f6e8f8e15ff4!8m2!3d10.3631813!4d77.9722131!16s%2Fg%2F11yty5b3yz?entry=ttu&g_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D', color: '#47281d' },
];

const FAQ = [
  { q: 'Do you deliver across Tamil Nadu?', a: 'Yes! We currently deliver across Tamil Nadu. Delivery typically takes 2–4 business days depending on your location.' },
  { q: 'Are your products preservative-free?', a: 'Absolutely. Every product at Kadhambam is 100% natural no artificial preservatives, no added sulfur, no chemicals.' },
  { q: 'Do you offer bulk / wholesale pricing?', a: 'Yes, we do! Drop us an email at kadhambamfoods@gmail.com or WhatsApp us with your requirements.' },
];


// ─── Contact form ─────────────────────────────────────────────────────────────
const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    setTimeout(() => {
      setForm({ name: '', email: '', message: '' });
      setSending(false);
      toast.success("Message sent! We'll get back to you soon 🌿");
    }, 1200);
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-two-col">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label" htmlFor="hp-name">Full Name</label>
          <input id="hp-name" name="name" type="text" className="input" placeholder="Ravi Kumar" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="label" htmlFor="hp-email">Email</label>
          <input id="hp-email" name="email" type="email" className="input" placeholder="ravi@email.com" value={form.email} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="label" htmlFor="hp-msg">Message</label>
        <textarea id="hp-msg" name="message" className="input" rows={4} placeholder="Tell us how we can help…" value={form.message} onChange={handleChange} required style={{ resize: 'vertical' }} />
      </div>
      <button type="submit" disabled={sending} className="btn btn-primary" style={{ alignSelf: 'flex-start', minWidth: 160 }}>
        {sending ? (
          <><span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16, animation: 'spin 700ms linear infinite' }}>progress_activity</span> Sending…</>
        ) : (
          <><span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16 }}>send</span> Send Message</>
        )}
      </button>
    </form>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories([{ id: 'all', name: 'All' }, ...cats]);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.categoryId === activeCategory);

  return (
    <div className="page-body-pad">
      <Header isLandingPage={true} />
      <OfferBar />

      {/* ── CAROUSEL ONLY ── */}
      <Carousel />

      <main id="main-content">
        {/* ══════════════════════════════════════════════════
            SHOP SECTION
        ══════════════════════════════════════════════════ */}
        <section id="shop" style={{
          maxWidth: 'var(--container-max)',
          margin: '0 auto',
          padding: 'clamp(56px, 8vw, 96px) var(--margin-mobile)',
          scrollMarginTop: 68,
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ display: 'inline-block', padding: '4px 16px', background: 'rgba(25,54,25,0.08)', borderRadius: 99, fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 14 }}>
              Our Collection
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10, lineHeight: 1.2 }}>
              Nature's Pantry
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-on-surface-variant)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              Premium sun-dried fruits and organic nuts sourced directly from sustainable farms, delivered across Tamil Nadu.
            </p>
          </div>

          {/* Category pills */}
          <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 36, justifyContent: 'center', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat.id} className={`pill${activeCategory === cat.id ? ' active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-card__img skeleton" />
                  <div className="skeleton-card__body">
                    <div className="skeleton" style={{ height: 18, width: '70%' }} />
                    <div className="skeleton" style={{ height: 13, width: '50%' }} />
                    <div className="skeleton" style={{ height: 26, width: '40%', marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 48, color: 'var(--color-outline)' }}>inventory_2</span>
              <p style={{ fontSize: 16, color: 'var(--color-on-surface-variant)' }}>
                {products.length === 0 ? 'Products coming soon check back shortly!' : 'No products in this category yet.'}
              </p>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* View All CTA fixed: Link with btn class, no nested button */}
          {!loading && filtered.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 52 }}>
              <Link
                to="/shop"
                className="btn btn-secondary btn-lg"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                View All Products
                <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18 }}>arrow_forward</span>
              </Link>
            </div>
          )}
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(195,200,190,0.5), transparent)' }} />

        {/* ══════════════════════════════════════════════════
            ABOUT SECTION
        ══════════════════════════════════════════════════ */}
        <section id="about" style={{
          background: 'linear-gradient(160deg, var(--color-surface-container-low) 0%, var(--color-surface-container) 100%)',
          padding: 'clamp(56px, 8vw, 96px) var(--margin-mobile)',
          scrollMarginTop: 68,
        }}>
          <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
            {/* Hero text */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ display: 'inline-block', padding: '4px 16px', background: 'rgba(25,54,25,0.08)', borderRadius: 99, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 14 }}>
                About Kadhambam
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.15, marginBottom: 14 }}>
                Rooted in Nature,<br />Delivered with Care
              </h2>
              <p style={{ fontSize: 16, color: 'var(--color-on-surface-variant)', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
                Born in Tamil Nadu, Kadhambam bridges conscientious farmers and mindful consumers
                delivering nature's finest harvest to your doorstep without shortcuts or preservatives.
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, background: 'var(--color-surface-container-lowest)', borderRadius: 20, border: '1px solid rgba(195,200,190,0.4)', overflow: 'hidden', marginBottom: 48, boxShadow: '0 4px 24px rgba(61,43,31,0.07)' }} className="stats-grid-landing">
              {STATS.map((s, i) => (
                <div key={s.label} style={{ textAlign: 'center', padding: '28px 16px', borderRight: i % 2 === 0 ? '1px solid rgba(195,200,190,0.3)' : 'none', borderBottom: i < 2 ? '1px solid rgba(195,200,190,0.3)' : 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 22, color: 'var(--color-primary)', display: 'block', marginBottom: 6, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface-variant)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Values grid */}
            <div className="values-grid" style={{ marginBottom: 40 }}>
              {VALUES.map(val => (
                <div key={val.title} style={{ padding: '28px 22px', background: 'var(--color-surface-container-lowest)', borderRadius: 20, border: '1px solid rgba(195,200,190,0.4)', boxShadow: '0 2px 10px rgba(61,43,31,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', transition: 'all 200ms ease', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(25,54,25,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(61,43,31,0.05)'; }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(25,54,25,0.1), rgba(25,54,25,0.05))', border: '1px solid rgba(25,54,25,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 26, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>{val.icon}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{val.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.7 }}>{val.desc}</p>
                </div>
              ))}
            </div>

            {/* Read more CTA fixed: Link with btn class */}
            <div style={{ textAlign: 'center' }}>
              <Link
                to="/about"
                className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18 }}>auto_stories</span>
                Read Our Full Story
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(195,200,190,0.5), transparent)' }} />

        {/* ══════════════════════════════════════════════════
            CONTACT SECTION
        ══════════════════════════════════════════════════ */}
        <section id="contact" style={{
          padding: 'clamp(56px, 8vw, 96px) var(--margin-mobile)',
          scrollMarginTop: 68,
        }}>
          <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ display: 'inline-block', padding: '4px 16px', background: 'rgba(25,54,25,0.08)', borderRadius: 99, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 14 }}>
                Contact Us
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.15, marginBottom: 12 }}>
                We'd Love to Hear from You
              </h2>
              <p style={{ fontSize: 16, color: 'var(--color-on-surface-variant)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
                Questions, feedback, or just saying hello our team is always here.
              </p>
            </div>

            {/* Channel cards */}
            <div className="contact-channels-grid" style={{ marginBottom: 52 }}>
              {CHANNELS.map(ch => (
                <a key={ch.label} href={ch.href} target={ch.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '20px 18px', background: 'var(--color-surface-container-lowest)', borderRadius: 18, border: '1px solid rgba(195,200,190,0.4)', boxShadow: '0 2px 10px rgba(61,43,31,0.05)', display: 'flex', flexDirection: 'column', gap: 10, transition: 'all 200ms ease', cursor: 'pointer', height: '100%' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(25,54,25,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(61,43,31,0.05)'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: ch.color + '18', border: `1px solid ${ch.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 22, color: ch.color, fontVariationSettings: "'FILL' 1" }}>{ch.icon}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-on-surface-variant)', marginBottom: 3 }}>{ch.label}</p>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>{ch.value}</p>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: ch.color }}>
                      Contact <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 13 }}>arrow_forward</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Form + FAQ */}
            <div className="contact-landing-layout">
              {/* Form */}
              <div style={{ background: 'var(--color-surface-container-lowest)', borderRadius: 24, padding: 'clamp(24px, 4vw, 40px)', border: '1px solid rgba(195,200,190,0.4)', boxShadow: '0 4px 20px rgba(61,43,31,0.06)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>Send Us a Message</h3>
                <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginBottom: 24 }}>We reply within 24 hours.</p>
                <ContactForm />
              </div>

              {/* FAQ */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 20 }}>Quick Answers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {FAQ.map((item, i) => (
                    <div key={i} style={{ background: 'var(--color-surface-container-lowest)', borderRadius: 16, border: `1px solid ${openFaq === i ? 'rgba(25,54,25,0.2)' : 'rgba(195,200,190,0.4)'}`, overflow: 'hidden', transition: 'border-color 200ms ease', boxShadow: openFaq === i ? '0 4px 16px rgba(25,54,25,0.08)' : 'none' }}>
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-on-surface)', flex: 1, lineHeight: 1.4 }}>{item.q}</span>
                        <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 20, color: 'var(--color-primary)', flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 250ms ease' }}>expand_more</span>
                      </button>
                      {openFaq === i && (
                        <div style={{ padding: '0 18px 18px', fontSize: 14, color: 'var(--color-on-surface-variant)', lineHeight: 1.8, borderTop: '1px solid rgba(195,200,190,0.3)', paddingTop: 14 }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Full contact page link fixed: Link with btn class */}
                <div style={{ marginTop: 24 }}>
                  <Link
                    to="/contact"
                    className="btn btn-outline"
                    style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16 }}>open_in_new</span>
                    View Full Contact Page
                  </Link>
                </div>

                {/* WhatsApp CTA */}
                <a href="https://wa.me/918825438334" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginTop: 14 }}>
                  <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #25d366, #1da851)', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,211,102,0.22)', transition: 'all 200ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.32)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.22)'; }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <WhatsAppSVG size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'white', marginBottom: 2 }}>Chat on WhatsApp</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Get a reply in minutes</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>arrow_forward</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />



    </div>
  );
};

export default HomePage;
