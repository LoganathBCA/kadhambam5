// src/pages/CheckoutPage.jsx
import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import { useCart, DELIVERY_RATE_PER_KG } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';
import toast from 'react-hot-toast';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateAddress,
  validateCity,
  validatePincode,
  validateUTR,
  sanitize,
} from '../utils/validate';

const UPI_VPA  = import.meta.env.VITE_UPI_VPA  || '8925312686@okbizaxis';
const UPI_NAME = import.meta.env.VITE_UPI_NAME || 'Kadhambam';

// ── Inline field error — always reserves height to prevent layout shift ────────
const FieldError = ({ id, message }) => (
  <div
    id={id}
    role={message ? 'alert' : undefined}
    aria-live="polite"
    style={{ minHeight: 22, display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 4 }}
  >
    {message && (
      <>
        <span
          className="material-symbols-outlined"
          style={{ fontFamily: 'Material Symbols Outlined', fontSize: 14, color: 'var(--color-error)', fontVariationSettings: "'FILL' 1", flexShrink: 0, marginTop: 1 }}
        >
          error
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-error)', lineHeight: 1.4, animation: 'validation-shake 200ms ease both' }}>
          {message}
        </span>
      </>
    )}
  </div>
);

// ── Labeled input row ──────────────────────────────────────────────────────────
const FormField = ({ id, label, required, error, hint, children }) => (
  <div className="form-group" style={{ marginBottom: 0 }}>
    <label className="label" htmlFor={id} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      {label}
      {required && <span style={{ color: 'var(--color-error)', fontSize: 14 }}>*</span>}
    </label>
    {children}
    <FieldError id={`${id}-error`} message={error} />
    {hint && !error && (
      <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>{hint}</p>
    )}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const CheckoutPage = () => {
  const { user }                                    = useAuth();
  const { cartItems, cartTotal, cartWeightKg, deliveryFee, clearCart } = useCart();
  const navigate                                    = useNavigate();
  const grandTotal                                  = cartTotal + deliveryFee;

  const [form, setForm] = useState({
    name:    user?.displayName || '',
    email:   user?.email       || '',
    phone:   '',
    address: '',
    city:    '',
    pincode: '',
    utr:     '',
  });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  // UPI deep-link for QR code (includes grand total with delivery)
  const upiUrl = `upi://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(UPI_NAME)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Kadhambam Order')}`;

  // Clear per-field error on change
  const handleChange = useCallback((field) => (e) => {
    const raw = e.target.value;
    setForm((prev) => ({ ...prev, [field]: raw }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }, [errors]);

  // Blur-time single-field validation
  const handleBlur = useCallback((field, validator) => () => {
    const err = validator(form[field]);
    if (err) setErrors((prev) => ({ ...prev, [field]: err }));
  }, [form]);

  // Full form validation before submit
  const validate = useCallback(() => {
    const e = {};

    const nameErr    = validateName(form.name);
    const phoneErr   = validatePhone(form.phone);
    const emailErr   = form.email.trim() ? validateEmail(form.email) : null;
    const addressErr = validateAddress(form.address);
    const cityErr    = validateCity(form.city);
    const pincodeErr = validatePincode(form.pincode);
    const utrErr     = validateUTR(form.utr);

    if (nameErr)    e.name    = nameErr;
    if (phoneErr)   e.phone   = phoneErr;
    if (emailErr)   e.email   = emailErr;
    if (addressErr) e.address = addressErr;
    if (cityErr)    e.city    = cityErr;
    if (pincodeErr) e.pincode = pincodeErr;
    if (utrErr)     e.utr     = utrErr;

    setErrors(e);

    // Scroll to first error field
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      document.getElementById(`co-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(e).length === 0;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted errors before placing your order.', { duration: 3000 });
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        userId:       user?.uid || 'guest',
        customerName: sanitize(form.name),
        email:        sanitize(form.email),
        phone:        sanitize(form.phone).replace(/\D/g, ''),
        address:      `${sanitize(form.address)}, ${sanitize(form.city)} - ${sanitize(form.pincode)}`,
        items:        cartItems,
        subtotal:     cartTotal,
        deliveryFee,
        total:        grandTotal,
        upiVpa:       UPI_VPA,
        utr:          sanitize(form.utr).replace(/\s/g, '').toUpperCase(),
        status:       'Pending',
      });

      clearCart();
      navigate('/order-success', { state: { orderId: order.id, customerName: sanitize(form.name) } });
    } catch (err) {
      if (import.meta.env.DEV) console.error('[checkout]', err);
      toast.error('Failed to place order. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Guard: empty cart ──
  if (cartItems.length === 0) {
    return (
      <div className="page-body-pad">
        <Header />
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 56, color: 'var(--color-outline-variant)' }}>shopping_cart</span>
          <p>Your cart is empty.</p>
          <Link to="/shop" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18 }}>storefront</span>
            Shop Now
          </Link>
        </div>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  // ── Guard: not signed in ──
  if (!user) {
    return (
      <div className="page-body-pad">
        <Header />
        <div className="empty-state" style={{ minHeight: '60vh', flexDirection: 'column', gap: 20 }}>
          <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 56, color: 'var(--color-primary)' }}>lock</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--color-primary)' }}>Sign in to Checkout</h2>
          <p style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', maxWidth: 320 }}>
            Please sign in with your Google account to place an order and track your delivery.
          </p>
          <Link to="/login?next=/checkout" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18 }}>login</span>
            Sign In to Continue
          </Link>
          <Link to="/cart" style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>← Back to Cart</Link>
        </div>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="page-body-pad">
      <Header />
      <main id="main-content">
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: 'var(--space-10) var(--margin-mobile)' }}>
          <h1 className="text-headline-lg" style={{ color: 'var(--color-primary)', marginBottom: 32 }}>
            Checkout
          </h1>

          <form onSubmit={handleSubmit} noValidate aria-label="Checkout form" id="checkout-form">
            <div className="checkout-layout" style={{ maxWidth: '100%', padding: 0, margin: 0 }}>

              {/* ── Left Column: Delivery + Payment ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Delivery Details Card */}
                <div style={{ background: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-outline-variant)', padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 20 }}>
                    Delivery Details
                  </h2>

                  {/* Name + Phone row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                    <FormField id="co-name" label="Full Name" required error={errors.name}>
                      <input
                        id="co-name"
                        className={`input${errors.name ? ' input-error' : ''}`}
                        type="text"
                        value={form.name}
                        onChange={handleChange('name')}
                        onBlur={handleBlur('name', validateName)}
                        placeholder="Your full name"
                        autoComplete="name"
                        maxLength={80}
                        aria-describedby={errors.name ? 'co-name-error' : undefined}
                        aria-invalid={!!errors.name}
                        spellCheck={false}
                      />
                    </FormField>

                    <FormField id="co-phone" label="Phone Number" required error={errors.phone} hint="10-digit Indian mobile number">
                      <input
                        id="co-phone"
                        className={`input${errors.phone ? ' input-error' : ''}`}
                        type="tel"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        onBlur={handleBlur('phone', validatePhone)}
                        placeholder="8825438334"
                        autoComplete="tel"
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[6-9][0-9]{9}"
                        aria-describedby={errors.phone ? 'co-phone-error' : undefined}
                        aria-invalid={!!errors.phone}
                      />
                    </FormField>
                  </div>

                  {/* Email (optional) */}
                  <div style={{ marginBottom: 16 }}>
                    <FormField id="co-email" label="Email Address" error={errors.email} hint="Optional — for order confirmation email">
                      <input
                        id="co-email"
                        className={`input${errors.email ? ' input-error' : ''}`}
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                        onBlur={() => {
                          if (form.email.trim()) {
                            const err = validateEmail(form.email);
                            if (err) setErrors((p) => ({ ...p, email: err }));
                          }
                        }}
                        placeholder="email@example.com"
                        autoComplete="email"
                        maxLength={254}
                        inputMode="email"
                        aria-describedby={errors.email ? 'co-email-error' : undefined}
                        aria-invalid={!!errors.email}
                      />
                    </FormField>
                  </div>

                  {/* Street Address */}
                  <div style={{ marginBottom: 16 }}>
                    <FormField id="co-address" label="Street Address" required error={errors.address}>
                      <textarea
                        id="co-address"
                        className={`input${errors.address ? ' input-error' : ''}`}
                        value={form.address}
                        onChange={handleChange('address')}
                        onBlur={handleBlur('address', validateAddress)}
                        placeholder="Door no, Street name, Area, Landmark"
                        rows={2}
                        autoComplete="street-address"
                        maxLength={300}
                        style={{ resize: 'vertical' }}
                        aria-describedby={errors.address ? 'co-address-error' : undefined}
                        aria-invalid={!!errors.address}
                      />
                    </FormField>
                  </div>

                  {/* City + Pincode row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <FormField id="co-city" label="City" required error={errors.city}>
                      <input
                        id="co-city"
                        className={`input${errors.city ? ' input-error' : ''}`}
                        type="text"
                        value={form.city}
                        onChange={handleChange('city')}
                        onBlur={handleBlur('city', validateCity)}
                        placeholder="Chennai"
                        autoComplete="address-level2"
                        maxLength={60}
                        aria-describedby={errors.city ? 'co-city-error' : undefined}
                        aria-invalid={!!errors.city}
                        spellCheck={false}
                      />
                    </FormField>

                    <FormField id="co-pincode" label="Pincode" required error={errors.pincode}>
                      <input
                        id="co-pincode"
                        className={`input${errors.pincode ? ' input-error' : ''}`}
                        type="text"
                        value={form.pincode}
                        onChange={handleChange('pincode')}
                        onBlur={handleBlur('pincode', validatePincode)}
                        placeholder="600001"
                        autoComplete="postal-code"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="\d{6}"
                        aria-describedby={errors.pincode ? 'co-pincode-error' : undefined}
                        aria-invalid={!!errors.pincode}
                      />
                    </FormField>
                  </div>
                </div>

                {/* UPI Payment Card */}
                <div style={{ background: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-outline-variant)', padding: 28 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 20 }}>
                    Pay via UPI
                  </h2>

                  {/* Step indicators */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    {['Scan QR & Pay', 'Enter UTR below'].map((label, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: 'var(--color-surface-container)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)' }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="qr-box">
                    <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>Scan the QR code to pay</p>

                    <div style={{ padding: 12, background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
                      <QRCodeSVG value={upiUrl} size={200} fgColor="#193619" bgColor="#ffffff" level="M" includeMargin={false} />
                    </div>

                    <div className="amount">₹{grandTotal.toLocaleString('en-IN')}</div>

                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 6 }}>Pay to UPI ID</p>
                      <span className="vpa">{UPI_VPA}</span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', textAlign: 'center', maxWidth: 280 }}>
                      Use any UPI app (GPay, PhonePe, Paytm, BHIM) to scan and pay. After payment, enter the UTR number below.
                    </p>

                    {/* Pay with UPI App button */}
                    <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <a
                        href={upiUrl}
                        style={{ textDecoration: 'none', display: 'block' }}
                        onClick={(e) => {
                          const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
                          if (!isMobile) {
                            e.preventDefault();
                            toast('Open this page on your phone to pay via UPI app 📱', { icon: '💡', duration: 4000 });
                          }
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 20px', background: 'linear-gradient(135deg, #4a2d82, #2d1b69)', borderRadius: 16, boxShadow: '0 4px 20px rgba(74,45,130,0.35)', cursor: 'pointer', transition: 'all 200ms ease' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(74,45,130,0.45)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(74,45,130,0.35)'; }}
                        >
                          <span style={{ fontSize: 24 }}>💸</span>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.2 }}>Pay with UPI App</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>GPay · PhonePe · Paytm · BHIM</p>
                          </div>
                          <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 20, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto' }}>arrow_forward</span>
                        </div>
                      </a>
                      <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>📱 Opens your UPI app automatically on mobile</p>
                    </div>
                  </div>

                  {/* UTR Input */}
                  <div style={{ marginTop: 24 }}>
                    <FormField
                      id="co-utr"
                      label="UPI Transaction ID / UTR Number"
                      required
                      error={errors.utr}
                      hint="Find the UTR in your UPI app under payment history / transaction details."
                    >
                      <input
                        id="co-utr"
                        className={`input${errors.utr ? ' input-error' : ''}`}
                        type="text"
                        value={form.utr}
                        onChange={handleChange('utr')}
                        onBlur={handleBlur('utr', validateUTR)}
                        placeholder="e.g. 426812345678"
                        maxLength={22}
                        style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                        autoComplete="off"
                        spellCheck={false}
                        aria-describedby={errors.utr ? 'co-utr-error' : 'co-utr-hint'}
                        aria-invalid={!!errors.utr}
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Order Summary ── */}
              <div>
                <div style={{ background: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-outline-variant)', padding: 28, position: 'sticky', top: 88 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 20 }}>
                    Order Summary
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {cartItems.map((item) => (
                      <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{item.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{item.weight} × {item.qty}</p>
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: 16, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>Subtotal</span>
                      <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span>Delivery</span>
                        <span style={{ fontSize: 11, opacity: 0.7 }}>
                          {cartWeightKg >= 1 ? `${cartWeightKg.toFixed(2)} kg` : `${Math.round(cartWeightKg * 1000)} g`} × ₹{DELIVERY_RATE_PER_KG}/kg
                        </span>
                      </span>
                      <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>₹{deliveryFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-outline-variant)', paddingTop: 12, marginTop: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
                      <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 22, color: 'var(--color-primary)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="checkout-submit-btn"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 700ms linear infinite' }} />
                        Confirming Order...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18 }}>check_circle</span>
                        Confirm Order
                      </>
                    )}
                  </button>

                  <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', textAlign: 'center', marginTop: 12 }}>
                    🔒 Your order details are securely saved
                  </p>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default CheckoutPage;
