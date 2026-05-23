/* eslint-disable react-refresh/only-export-components */
// src/context/CartContext.jsx
import { createContext, useContext, useReducer, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
export const DELIVERY_RATE_PER_KG = 40;
const CART_KEY = 'kadhambam_cart';
const CART_VERSION = 1; // bump this to wipe old incompatible carts

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — weight & delivery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse weight strings like "250g", "500g", "1kg" → number in kg.
 * For count-type labels like "1 pc", "6 pcs", assumes 100g per piece.
 */
export const parseWeightKg = (weightStr) => {
  if (!weightStr) return 0;
  const s = String(weightStr).trim().toLowerCase();
  if (s.endsWith('kg')) return parseFloat(s) || 0;
  if (s.endsWith('g'))  return (parseFloat(s) || 0) / 1000;
  // Count labels: "1 pc", "6 pcs", "12 pcs" — assume 100g each
  const pcMatch = s.match(/^(\d+)\s*pcs?$/);
  if (pcMatch) return (parseInt(pcMatch[1], 10) * 100) / 1000;
  return 0;
};

/** Calculate total delivery fee from an array of cart items */
export const calcDelivery = (items) => {
  const totalKg = items.reduce(
    (sum, item) => sum + parseWeightKg(item.weight) * item.qty,
    0,
  );
  if (totalKg === 0) return 0;
  return Math.max(10, Math.round(totalKg * DELIVERY_RATE_PER_KG));
};

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — safe read / write
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate and sanitize a single cart item.
 * Returns null if the item is fundamentally broken (no key/id).
 */
const sanitizeItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  // Must have a stable key and product id
  const key = item.key || (item.id && item.weight ? `${item.id}_${item.weight}` : null);
  if (!key) return null;

  // JSON.stringify converts NaN → null, so check for null explicitly too
  if (item.price === null || item.price === undefined) return null;
  const price = Number(item.price);
  const qty   = Number(item.qty);

  // Discard items with invalid numeric fields (price must be > 0 for real products)
  if (!isFinite(price) || price <= 0) return null;
  if (!isFinite(qty)   || qty   <= 0) return null;

  return {
    key,
    id:     item.id     || key.split('_')[0],
    name:   item.name   || 'Unknown Product',
    price:  price,
    image:  item.image  || '',
    weight: item.weight || '',
    qty:    Math.max(1, Math.floor(qty)),
  };
};

/** Read cart from localStorage; returns a clean, validated array */
const loadCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    // Version check — if stored version differs, wipe and start fresh
    if (parsed && parsed.__v !== CART_VERSION) {
      localStorage.removeItem(CART_KEY);
      return [];
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    // Sanitize every item; drop any that fail validation
    return items.map(sanitizeItem).filter(Boolean);
  } catch {
    // Corrupt JSON — clear and start fresh
    try { localStorage.removeItem(CART_KEY); } catch { /* ignore */ }
    return [];
  }
};

/**
 * Write cart to localStorage synchronously.
 * Handles QuotaExceededError gracefully — logs a warning but never throws.
 */
const saveCart = (items) => {
  try {
    const payload = { __v: CART_VERSION, items };
    localStorage.setItem(CART_KEY, JSON.stringify(payload));
  } catch (e) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      // Storage full — try removing old data and retrying once
      try {
        localStorage.removeItem(CART_KEY);
        localStorage.setItem(CART_KEY, JSON.stringify({ __v: CART_VERSION, items: [] }));
      } catch { /* nothing we can do */ }
      console.warn('[CartContext] localStorage quota exceeded — cart cleared');
    }
    // Other errors (e.g. private browsing on some browsers) — silently ignore
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Reducer — every action also persists to localStorage synchronously
// (synchronous write means a hard refresh immediately after any action will
//  always see the current state, not the state before the last effect flush)
// ─────────────────────────────────────────────────────────────────────────────

const cartReducer = (state, action) => {
  let nextState;

  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, weight, variantPrice } = action.payload;
      const key = `${product.id}_${weight}`;
      const existing = state.find((i) => i.key === key);
      const price = variantPrice != null ? Number(variantPrice) : Number(product.price);
      const safePrice = isFinite(price) && price >= 0 ? price : 0;

      if (existing) {
        nextState = state.map((i) =>
          i.key === key ? { ...i, qty: i.qty + 1 } : i,
        );
      } else {
        nextState = [
          ...state,
          {
            key,
            id:     product.id,
            name:   product.name    || 'Unknown',
            price:  safePrice,
            image:  product.image   || '',
            weight: weight          || '',
            qty:    1,
          },
        ];
      }
      break;
    }

    case 'REMOVE_ITEM':
      nextState = state.filter((i) => i.key !== action.payload.key);
      break;

    case 'UPDATE_QTY': {
      const { key, qty } = action.payload;
      const safeQty = Math.max(1, Math.floor(Number(qty) || 1));
      nextState = state.map((i) =>
        i.key === key ? { ...i, qty: safeQty } : i,
      );
      break;
    }

    case 'CLEAR_CART':
      nextState = [];
      break;

    // Internal: re-load from storage (e.g. another tab changed it)
    case 'HYDRATE_CART':
      nextState = action.payload.items;
      break;

    default:
      return state; // no-op — don't persist
  }

  // Persist synchronously so the data is on disk before React re-renders
  saveCart(nextState);
  return nextState;
};

// ─────────────────────────────────────────────────────────────────────────────
// Context + Provider
// ─────────────────────────────────────────────────────────────────────────────

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // loadCart is called once as the lazy initializer — safe, no side-effects
  const [cartItems, dispatch] = useReducer(cartReducer, undefined, loadCart);

  // ── Actions ──────────────────────────────────────────────────────────────
  const addToCart = useCallback(
    (product, weight = '500g', variantPrice = null) =>
      dispatch({ type: 'ADD_ITEM', payload: { product, weight, variantPrice } }),
    [],
  );

  const removeFromCart = useCallback(
    (key) => dispatch({ type: 'REMOVE_ITEM', payload: { key } }),
    [],
  );

  const updateQty = useCallback(
    (key, qty) => dispatch({ type: 'UPDATE_QTY', payload: { key, qty } }),
    [],
  );

  const clearCart = useCallback(
    () => dispatch({ type: 'CLEAR_CART' }),
    [],
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const cartWeightKg = cartItems.reduce(
    (sum, i) => sum + parseWeightKg(i.weight) * i.qty,
    0,
  );
  const deliveryFee = calcDelivery(cartItems);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        cartCount,
        cartWeightKg,
        deliveryFee,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};
