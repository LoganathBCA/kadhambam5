// src/pages/OrderSuccessPage.jsx
import { useLocation, Link, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';

const OrderSuccessPage = () => {
  const { state } = useLocation();

  // If accessed directly without going through checkout, redirect home
  if (!state?.orderId) {
    return <Navigate to="/" replace />;
  }

  const orderId = state.orderId;
  const customerName = state.customerName || 'Customer';

  return (
    <div className="page-body-pad">
      <Header />
      <div className="success-page">
        <div className="success-card">
          {/* Animated checkmark */}
          <div className="success-icon" style={{ animation: 'modal-in 400ms ease' }}>
            <span className="material-symbols-outlined" style={{
              fontFamily: 'Material Symbols Outlined',
              fontSize: 40, color: 'var(--color-primary)',
              fontVariationSettings: "'FILL' 1",
            }}>check_circle</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 16 }}>
            Order Placed!
          </h1>

          {/* The EXACT required success message */}
          <p style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--color-on-surface)',
            lineHeight: 1.5,
            marginBottom: 24,
            padding: '20px 24px',
            background: 'var(--color-primary-fixed)',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--color-primary-fixed-dim)',
          }}>
            We will confirm your payment in a while.
          </p>

          <div style={{
            background: 'var(--color-surface-container)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 24px',
            marginBottom: 28,
            fontSize: 14,
            color: 'var(--color-on-surface-variant)',
            textAlign: 'left',
          }}>
            <p style={{ marginBottom: 4 }}>
              <strong>Order ID:</strong>{' '}
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                {orderId}
              </span>
            </p>
            <p>
              <strong>Customer:</strong> {customerName}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              to="/account"
              className="btn btn-primary"
              style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 18 }}>receipt_long</span>
              View My Orders
            </Link>
            <Link
              to="/shop"
              className="btn btn-outline"
              style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Continue Shopping
            </Link>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', marginTop: 20, lineHeight: 1.6 }}>
            📦 Our team will verify your UPI payment and dispatch your order within 24 hours.
            You'll receive a WhatsApp update once your order is confirmed.
          </p>
        </div>
      </div>
      <MobileNav />
      <Footer />
    </div>
  );
};

export default OrderSuccessPage;
