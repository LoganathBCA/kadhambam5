// src/components/ui/Carousel.jsx
// Performance-optimised:
//   • First slide: WebP <picture> with JPG fallback, fetchpriority="high", eager load
//   • Slides 2-4: lazy-loaded WebP + LQIP blur placeholder
//   • Progress bar: CSS animation (no rAF loop)
//   • Auto-advance: 4s (was 2s — gives more time per slide)
//   • Touch + keyboard navigation
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── Static imports (Vite bundles these and generates hashed filenames)
// Only slide1 is imported statically — it's the LCP element and must be bundled
import img1    from '../../assets/slide1.webp';
import img1Jpg from '../../assets/slide1.jpg';  // fallback for old browsers

// Slides 2-4: lazy URL strings using Vite's ?url import (no bundle cost)
const img2Url    = new URL('../../assets/slide2.webp', import.meta.url).href;
const img2JpgUrl = new URL('../../assets/slide2.jpg',  import.meta.url).href;
const img3Url    = new URL('../../assets/slide3.webp', import.meta.url).href;
const img3JpgUrl = new URL('../../assets/slide3.jpg',  import.meta.url).href;
const img4Url    = new URL('../../assets/slide4.webp', import.meta.url).href;
const img4JpgUrl = new URL('../../assets/slide4.jpg',  import.meta.url).href;

// LQIP — tiny blurred base64 placeholders shown while full image loads
const LQIP = {
  1: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDADUlKC8oITUvKy88OTU/UIVXUElJUKN1e2GFwarLyL6qurfV8P//1eL/5re6////////////zv//////////////2wBDATk8PFBGUJlXV53/3Lrc///////////////////////////////////////////////////////////wAARCAAUABQDASIAAhEBAxEB/8QAGAABAQADAAAAAAAAAAAAAAAAAAECAwT/xAAYEAEBAQEBAAAAAAAAAAAAAAAAEQIBIf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A4c56XPGWdcLeoNdgtvoIkUAQAH//2Q==',
  2: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDADUlKC8oITUvKy88OTU/UIVXUElJUKN1e2GFwarLyL6qurfV8P//1eL/5re6////////////zv//////////////2wBDATk8PFBGUJlXV53/3Lrc///////////////////////////////////////////////////////////wAARCAAUABQDASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAIBAwT/xAAbEAEAAgIDAAAAAAAAAAAAAAAAEQIBIQMS/8EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALnzZee/qW2ZVzbieo6YFIyUzoBVROgBH//2Q==',
  3: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDADUlKC8oITUvKy88OTU/UIVXUElJUKN1e2GFwarLyL6qurfV8P//1eL/5re6////////////zv//////////////2wBDATk8PFBGUJlXV53/3Lrc///////////////////////////////////////////////////////////wAARCAAUABQDASIAAhEBAxEB/8QAGAABAAMBAAAAAAAAAAAAAAAAAAECAwT/xAAYEAEBAQEBAAAAAAAAAAAAAAAAERIBIf/EABYBAQEBAAAAAAAAAAAAAAAAAAQCA//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOut3WxjZdR6yrfoZTcAWMBRAAD//2Q==',
  4: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDADUlKC8oITUvKy88OTU/UIVXUElJUKN1e2GFwarLyL6qurfV8P//1eL/5re6////////////zv//////////////2wBDATk8PFBGUJlXV53/3Lrc///////////////////////////////////////////////////////////wAARCAAUABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAMBBP/EABoQAQACAwEAAAAAAAAAAAAAAAABAgMREiH/EABYBAQEBAAAAAAAAAAAAAAAAAQQCA//EABYRAQEBAAAAAAAAAAAAAAAAACEBEf/aAAwDAQACEQMRAD8AjpynbyIWv6zpzrSs3kS6FpiUzJuQUbsAH//2Q==',
};

const INTERVAL_MS = 2000; // 2 s — faster auto-advance

const slides = [
  {
    webp: img1,
    jpg:  img1Jpg,
    alt:  "Premium Dry Fruits Collection — Almonds, Cashews, Pistachios & More",
    link: '/shop',
    cta:  'Shop Now',
    label: 'Dry Fruits',
    headline: "Nature's Finest Harvest",
    sub: 'Premium nuts & dry fruits, straight from the farm',
    lqip: LQIP[1],
  },
  {
    webp: img2Url,
    jpg:  img2JpgUrl,
    alt:  "Sun-Dried Berries & Fruits — Apricots, Raisins & Figs",
    link: '/shop?search=berries',
    cta:  'Explore Berries',
    label: 'Dried Fruits',
    headline: 'Sun-Kissed Goodness',
    sub: 'Sulphur-free, preservative-free dried fruits',
    lqip: LQIP[2],
  },
  {
    webp: img3Url,
    jpg:  img3JpgUrl,
    alt:  "Organic Seeds Collection — Chia, Pumpkin, Flax & More",
    link: '/shop?search=seeds',
    cta:  'Shop Seeds',
    label: 'Organic Seeds',
    headline: 'Seeds of Wellness',
    sub: 'Cold-pressed organic seeds for a healthier you',
    lqip: LQIP[3],
  },
  {
    webp: img4Url,
    jpg:  img4JpgUrl,
    alt:  "Farm to Doorstep — Walnuts, Dates & Cranberries",
    link: '/shop',
    cta:  'View Collection',
    label: 'Farm Fresh',
    headline: 'From Farm to Table',
    sub: 'Pure goodness delivered to your doorstep',
    lqip: LQIP[4],
  },
];

// ── SlideImage: renders a <picture> with WebP + JPG fallback
//    First slide is eager + fetchpriority="high" for LCP
//    Others are lazy with LQIP blur placeholder
const SlideImage = ({ slide, index, isCurrent }) => {
  const [loaded, setLoaded] = useState(index === 0);
  const isFirst = index === 0;

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        backgroundImage: !loaded ? `url(${slide.lqip})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: !loaded ? 'blur(8px)' : 'none',
        transition: 'filter 400ms ease',
      }}
    >
      <picture>
        <source srcSet={slide.webp} type="image/webp" />
        <img
          src={slide.jpg}
          alt={slide.alt}
          loading={isFirst ? 'eager' : 'lazy'}
          decoding={isFirst ? 'sync' : 'async'}
          fetchPriority={isFirst ? 'high' : 'low'}
          draggable={false}
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            transition: 'transform 8000ms linear, opacity 400ms ease',
            transform: isCurrent ? 'scale(1.04)' : 'scale(1)',
            opacity: loaded ? 1 : 0,
            pointerEvents: 'none',
            willChange: isCurrent ? 'transform' : 'auto',
          }}
        />
      </picture>
    </div>
  );
};

const Carousel = () => {
  const [current, setCurrent] = useState(0);
  const timerRef    = useRef(null);
  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const dragDeltaX  = useRef(0);
  // Track which slides have been preloaded
  const [preloaded, setPreloaded] = useState(new Set([0]));

  const [isTransitioning, setIsTransitioning] = useState(true);

  const goTo = useCallback((idx) => {
    setIsTransitioning(true);
    setCurrent(idx);
    // Preload next slide
    const nextIdx = (idx + 1) % slides.length;
    setPreloaded(prev => {
      const updated = new Set(prev);
      updated.add(idx);
      updated.add(nextIdx);
      return updated;
    });
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current === 0 ? slides.length - 1 : current - 1), [current, goTo]);

  // Seamless jump back to start when reaching the cloned slide
  useEffect(() => {
    if (current === slides.length) {
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setCurrent(0);
      }, 650); // Matches CSS transition duration
      return () => clearTimeout(t);
    }
  }, [current]);

  // Preload slide 1 immediately (not in JS bundle, just hint the browser)
  useEffect(() => {
    // Add <link rel="preload"> for slide 2 so it's ready when carousel advances
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = slides[1].webp;
    link.type = 'image/webp';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Auto-advance
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        const n = c + 1;
        setPreloaded(prev => {
          const updated = new Set(prev);
          updated.add(n % slides.length);
          updated.add((n + 1) % slides.length);
          return updated;
        });
        return n;
      });
    }, INTERVAL_MS + 650); // Add 650ms to allow transition to finish before next tick
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  { prev(); startTimer(); }
      if (e.key === 'ArrowRight') { next(); startTimer(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, startTimer]);

  // Touch / mouse drag
  const handleDragStart = (clientX) => {
    isDragging.current = true;
    dragStartX.current = clientX;
    dragDeltaX.current = 0;
    clearInterval(timerRef.current);
  };

  const handleDragMove = (clientX) => {
    if (!isDragging.current) return;
    dragDeltaX.current = clientX - dragStartX.current;
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if      (dragDeltaX.current < -50) { next(); }
    else if (dragDeltaX.current >  50) { prev(); }
    startTimer();
  };

  return (
    <section style={{ padding: '24px 0 0' }} aria-label="Featured product carousel" aria-roledescription="carousel">
      <div className="carousel-wrapper">
        <div
          className="carousel-container"
          onTouchStart={e  => handleDragStart(e.touches[0].clientX)}
          onTouchMove={e   => handleDragMove(e.touches[0].clientX)}
          onTouchEnd={handleDragEnd}
          onMouseDown={e   => handleDragStart(e.clientX)}
          onMouseMove={e   => handleDragMove(e.clientX)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          role="region"
          aria-live="polite"
          style={{ cursor: 'grab', userSelect: 'none' }}
        >
          {/* ── Sliding track */}
          <div
            className="carousel-track"
            style={{ 
              transform: `translateX(-${current * 100}%)`,
              transition: isTransitioning ? 'transform 650ms cubic-bezier(0.77, 0, 0.175, 1)' : 'none'
            }}
          >
            {[...slides, slides[0]].map((slide, i) => {
              // Map cloned slide index back to original for preloading/rendering logic
              const originalIndex = i % slides.length;
              // Only render slides that are current, adjacent, or already preloaded
              const shouldRender = Math.abs(i - current) <= 1 || preloaded.has(originalIndex);
              return (
                <div
                  key={i}
                  className="carousel-slide"
                  aria-roledescription="slide"
                  aria-label={`Slide ${originalIndex + 1} of ${slides.length}: ${slide.label}`}
                  aria-hidden={i !== current}
                >
                  {shouldRender && (
                    <SlideImage slide={slide} index={originalIndex} isCurrent={i === current} />
                  )}

                  {/* Left gradient for text readability */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(15,35,15,0.72) 0%, rgba(0,0,0,0.28) 45%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                  {/* Bottom fade */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.32) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />

                  {/* Slide text content — only render for active slide */}
                  {i === current && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      padding: 'clamp(20px, 5vw, 56px)',
                      zIndex: 5,
                      pointerEvents: 'none',
                    }}>
                      {/* Label pill */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 14px',
                        background: 'rgba(200,236,194,0.2)',
                        border: '1px solid rgba(200,236,194,0.35)',
                        borderRadius: 99,
                        fontSize: 'clamp(9px, 1vw, 11px)', fontWeight: 800,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: '#c8ecc2',
                        marginBottom: 'clamp(10px, 2vw, 16px)',
                        width: 'fit-content',
                        animation: 'slide-in-left 400ms cubic-bezier(0.16,1,0.3,1) both',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 12, fontVariationSettings: "'FILL' 1" }}>eco</span>
                        {slide.label}
                      </span>

                      {/* Headline */}
                      <h2 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'clamp(20px, 4.5vw, 52px)', fontWeight: 700,
                        color: 'white', lineHeight: 1.1,
                        marginBottom: 'clamp(8px, 1.5vw, 14px)',
                        maxWidth: '12em',
                        textShadow: '0 2px 12px rgba(0,0,0,0.25)',
                        animation: 'slide-in-left 450ms 60ms cubic-bezier(0.16,1,0.3,1) both',
                      }}>
                        {slide.headline}
                      </h2>

                      {/* Sub */}
                      <p style={{
                        fontSize: 'clamp(11px, 1.6vw, 15px)',
                        color: 'rgba(255,255,255,0.82)',
                        marginBottom: 'clamp(14px, 3vw, 28px)',
                        maxWidth: '28em', lineHeight: 1.55,
                        animation: 'slide-in-left 500ms 120ms cubic-bezier(0.16,1,0.3,1) both',
                      }}>
                        {slide.sub}
                      </p>

                      {/* CTA */}
                      <div style={{ animation: 'slide-in-left 550ms 180ms cubic-bezier(0.16,1,0.3,1) both', pointerEvents: 'auto' }}>
                        <Link to={slide.link} aria-label={`${slide.cta} — ${slide.headline}`}>
                          <button style={{
                            padding: 'clamp(9px, 1.3vw, 13px) clamp(18px, 2.5vw, 30px)',
                            borderRadius: 99,
                            background: 'white', color: '#193619',
                            fontWeight: 800, fontSize: 'clamp(11px, 1.2vw, 14px)',
                            border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
                            letterSpacing: '0.02em',
                            transition: 'all 180ms ease',
                            whiteSpace: 'nowrap',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.28)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.22)'; }}
                          >
                            {slide.cta}
                            <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 'clamp(13px, 1.3vw, 16px)' }}>arrow_forward</span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prev / Next buttons */}
          <button className="carousel-btn carousel-btn-prev" onClick={e => { e.stopPropagation(); prev(); startTimer(); }} aria-label="Previous slide">
            <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 22 }}>chevron_left</span>
          </button>
          <button className="carousel-btn carousel-btn-next" onClick={e => { e.stopPropagation(); next(); startTimer(); }} aria-label="Next slide">
            <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 22 }}>chevron_right</span>
          </button>

          {/* Progress dots — CSS animation, no rAF loop */}
          <div
            role="tablist"
            aria-label="Slides"
            style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 8, zIndex: 10, alignItems: 'center',
            }}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === (current % slides.length)}
                aria-label={`Go to slide ${i + 1}`}
                onClick={e => { e.stopPropagation(); goTo(i); startTimer(); }}
                style={{
                  padding: 0, border: 'none', cursor: 'pointer', background: 'transparent',
                  position: 'relative',
                  width: i === (current % slides.length) ? 36 : 8, height: 8,
                  borderRadius: 99,
                  transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
                  overflow: 'hidden', flexShrink: 0,
                }}
              >
                <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: 'rgba(255,255,255,0.35)' }} />
                {i === (current % slides.length) && (
                  <span style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    borderRadius: 99, background: 'white',
                    // CSS animation for progress — no JS RAF loop
                    animation: `carousel-progress ${INTERVAL_MS}ms linear both`,
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Slide counter */}
          <div aria-live="polite" aria-atomic="true" style={{
            position: 'absolute', top: 14, right: 16,
            background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)',
            color: 'rgba(255,255,255,0.88)',
            fontSize: 11, fontWeight: 700,
            padding: '4px 10px', borderRadius: 99, zIndex: 10, letterSpacing: '0.06em',
          }}>
            {(current % slides.length) + 1} / {slides.length}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes carousel-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
};

export default Carousel;
