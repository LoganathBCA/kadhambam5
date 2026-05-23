// src/pages/admin/AdminOrders.jsx
import { useEffect, useRef, useState } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { getOrders, updateOrderStatus, updateOrderTracking } from '../../services/orderService';
import toast from 'react-hot-toast';

const REFRESH_INTERVAL_SEC = 60;

const TRACKING_STEPS = ['Packed', 'Out for Delivery', 'Delivered'];

const TRACKING_ICONS = {
  Packed: 'inventory_2',
  'Out for Delivery': 'local_shipping',
  Delivered: 'check_circle',
};

const downloadCSV = (orders) => {
  const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Address', 'Items', 'Total', 'UTR', 'Status', 'Tracking', 'Date'];
  const rows = orders.map(o => [
    o.id,
    o.customerName || '',
    o.email || '',
    o.phone || '',
    o.address || '',
    (o.items || []).map(i => `${i.name}×${i.qty}(${i.weight})`).join('; '),
    o.total || 0,
    o.utr || '',
    o.status || '',
    o.tracking || '',
    o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kadhambam_orders_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SEC);
  const [trackingLoading, setTrackingLoading] = useState({});
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const load = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    getOrders()
      .then(setOrders)
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  const startAutoRefresh = () => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);
    setCountdown(REFRESH_INTERVAL_SEC);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL_SEC : prev - 1));
    }, 1000);
    intervalRef.current = setInterval(() => {
      load(false);
      setCountdown(REFRESH_INTERVAL_SEC);
    }, REFRESH_INTERVAL_SEC * 1000);
  };

  const handleManualRefresh = () => {
    load(true);
    startAutoRefresh();
    toast.success('Orders refreshed');
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    startAutoRefresh();
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'Verified');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Verified', tracking: null } : o));
      toast.success('Order verified!');
    } catch {
      toast.error('Failed to verify order');
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order? The customer will be notified.')) return;
    try {
      await updateOrderStatus(orderId, 'Cancelled');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
      toast.success('Order cancelled');
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  const handleTracking = async (orderId, step) => {
    setTrackingLoading(prev => ({ ...prev, [orderId]: step }));
    try {
      await updateOrderTracking(orderId, step);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking: step } : o));
      toast.success(`Order marked as "${step}"`);
    } catch {
      toast.error('Failed to update tracking');
    } finally {
      setTrackingLoading(prev => ({ ...prev, [orderId]: null }));
    }
  };

  const handleWhatsApp = (order) => {
    const cleanPhone = (order.phone || '').replace(/\D/g, '');
    const trackingMsg = order.tracking ? ` Current status: ${order.tracking}.` : '';
    const msg = `Hello ${order.customerName}, your payment verification is successful and your order (${order.id}) is prepared for delivery.${trackingMsg}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  // Tracking stepper for a verified order row
  const TrackingStepper = ({ order }) => {
    const currentIdx = TRACKING_STEPS.indexOf(order.tracking);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
        {TRACKING_STEPS.map((step, idx) => {
          const isDone = currentIdx >= idx;
          const isNext = idx === currentIdx + 1;
          const isLoading = trackingLoading[order.id] === step;
          return (
            <button
              key={step}
              onClick={() => isNext ? handleTracking(order.id, step) : undefined}
              disabled={!isNext || isLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 10,
                border: `1.5px solid ${isDone ? '#193619' : isNext ? '#2a5c2a' : 'var(--color-outline-variant)'}`,
                background: isDone
                  ? 'linear-gradient(135deg, #2a5c2a, #193619)'
                  : isNext
                    ? 'rgba(25,54,25,0.07)'
                    : 'transparent',
                color: isDone ? 'white' : isNext ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                fontSize: 12, fontWeight: 600,
                cursor: isNext ? 'pointer' : 'default',
                opacity: !isDone && !isNext ? 0.5 : 1,
                transition: 'all 150ms ease',
                textAlign: 'left',
              }}
              title={isNext ? `Click to mark as "${step}"` : isDone ? 'Completed' : 'Not yet'}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontFamily: 'Material Symbols Outlined',
                  fontSize: 15,
                  fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {isLoading ? 'progress_activity' : TRACKING_ICONS[step]}
              </span>
              {step}
              {isDone && !isLoading && (
                <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.85 }}>✓</span>
              )}
              {isNext && !isLoading && (
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>Click</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // WhatsApp SVG icon
  const WhatsAppIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  // ── Shared action buttons ────────────────────────────────────────────────────
  const OrderActions = ({ order }) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {order.status === 'Pending' && (
        <>
          <button
            onClick={() => handleVerify(order.id)}
            style={{ padding: '7px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', transition: 'opacity 150ms' }}
            onMouseEnter={e => e.target.style.opacity = '0.8'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >✓ Verify</button>
          <button
            onClick={() => handleCancel(order.id)}
            style={{ padding: '7px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-error-container)', color: 'var(--color-error)', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', transition: 'opacity 150ms' }}
            onMouseEnter={e => e.target.style.opacity = '0.8'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >✗ Cancel</button>
        </>
      )}
      <button
        onClick={() => handleWhatsApp(order)}
        style={{ padding: '7px 12px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #25d366, #1da851)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(37,211,102,0.3)', transition: 'all 150ms ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,211,102,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,211,102,0.3)'; }}
        title="Send WhatsApp message"
      >
        <WhatsAppIcon size={14} /> WhatsApp
      </button>
    </div>
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>Orders</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Auto-refresh countdown */}
            <div title="Auto-refreshes every 60 seconds" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-variant)', color: 'var(--color-on-surface-variant)', fontSize: 11, fontWeight: 600, border: '1px solid var(--color-outline-variant)', userSelect: 'none' }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: countdown <= 10 ? 'var(--color-error, #e53935)' : 'var(--color-primary)', animation: 'pulse 1.4s infinite' }} />
              {countdown}s
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleManualRefresh} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px' }}>
              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 15 }}>refresh</span>
              <span className="admin-btn-label">Refresh</span>
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => downloadCSV(orders)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px' }}>
              <span className="material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 15 }}>download</span>
              <span className="admin-btn-label">CSV</span>
            </button>
          </div>
        </div>

        <div className="admin-page-content">
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {['all', 'Pending', 'Verified', 'Cancelled'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600, border: '1.5px solid', borderColor: filter === f ? 'var(--color-primary)' : 'var(--color-outline-variant)', background: filter === f ? 'var(--color-primary)' : 'transparent', color: filter === f ? 'white' : 'var(--color-on-surface-variant)', cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}>
                {f === 'all' ? 'All' : f} <span style={{ fontWeight: 400, opacity: 0.8 }}>({f === 'all' ? orders.length : orders.filter(o => o.status === f).length})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-on-surface-variant)' }}>No orders found</div>
          ) : (
            <>
              {/* ── DESKTOP TABLE (hidden on mobile) ── */}
              <div className="admin-table-wrap orders-desktop-table" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th><th>Customer</th><th>Phone</th><th>Items</th>
                      <th>Total</th><th>UTR</th><th>Date</th><th>Status</th>
                      <th>Tracking / Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order) => (
                      <tr key={order.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, maxWidth: 120, wordBreak: 'break-all' }}>{order.id}</td>
                        <td>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{order.customerName || '-'}</p>
                          <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{order.email || ''}</p>
                        </td>
                        <td style={{ fontSize: 13 }}>{order.phone || '-'}</td>
                        <td style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', maxWidth: 160 }}>
                          {(order.items || []).map(i => `${i.name} ×${i.qty}`).join(', ')}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{order.total?.toLocaleString('en-IN') || '-'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.utr || '-'}</td>
                        <td style={{ fontSize: 12 }}>{formatDate(order.createdAt)}</td>
                        <td>
                          <span className={`status-badge ${order.status === 'Verified' ? 'status-verified' : order.status === 'Cancelled' ? 'status-cancelled' : 'status-pending'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ minWidth: 240 }}>
                          {order.status === 'Verified' ? <TrackingStepper order={order} /> :
                           order.status === 'Cancelled' ? <span style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>—</span> :
                           <span style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>Verify first</span>}
                          <div style={{ marginTop: 8 }}><OrderActions order={order} /></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE CARDS (hidden on desktop) ── */}
              <div className="orders-mobile-cards">
                {filtered.map((order) => (
                  <div key={order.id} style={{ background: 'var(--color-surface-container-lowest)', borderRadius: 16, border: '1px solid var(--color-outline-variant)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(61,43,31,0.06)' }}>
                    {/* Card header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-primary)', marginBottom: 2 }}>{order.customerName || 'Unknown'}</p>
                        <p style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--color-on-surface-variant)', wordBreak: 'break-all' }}>{order.id}</p>
                        <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 3 }}>📞 {order.phone || '-'} · {formatDate(order.createdAt)}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className={`status-badge ${order.status === 'Verified' ? 'status-verified' : order.status === 'Cancelled' ? 'status-cancelled' : 'status-pending'}`}>
                          {order.status}
                        </span>
                        <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 16, color: 'var(--color-primary)', marginTop: 6 }}>
                          ₹{order.total?.toLocaleString('en-IN') || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Items + UTR */}
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-outline-variant)', fontSize: 12 }}>
                      <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 4 }}>
                        {(order.items || []).map(i => `${i.name} ×${i.qty}`).join(', ')}
                      </p>
                      {order.utr && <p style={{ fontFamily: 'monospace', color: 'var(--color-secondary)', fontWeight: 600 }}>UTR: {order.utr}</p>}
                    </div>

                    {/* Tracking (verified only) */}
                    {order.status === 'Verified' && (
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-on-surface-variant)', marginBottom: 8 }}>Tracking</p>
                        <TrackingStepper order={order} />
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ padding: '12px 16px' }}>
                      <OrderActions order={order} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .orders-desktop-table { display: none; }
        .orders-mobile-cards  { display: flex; flex-direction: column; gap: 14px; }
        @media (min-width: 900px) {
          .orders-desktop-table { display: block; }
          .orders-mobile-cards  { display: none; }
        }
        .admin-btn-label { display: none; }
        @media (min-width: 600px) {
          .admin-btn-label { display: inline; }
        }
      `}</style>
    </div>
  );
};

export default AdminOrders;

