'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'eds-cart-v1';

export function useCart() {
  return useContext(CartContext);
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const clamp = (qty, max) => Math.max(1, Math.min(qty, max || 1));

  const add = item =>
    setItems(prev => {
      const found = prev.find(i => i.variantId === item.variantId);
      if (found) {
        return prev.map(i => i.variantId === item.variantId
          ? { ...i, max: item.max, qty: clamp(i.qty + item.qty, item.max) } : i);
      }
      return [...prev, { ...item, qty: clamp(item.qty, item.max) }];
    });

  const setQty = (variantId, qty) =>
    setItems(prev => prev.map(i => i.variantId === variantId ? { ...i, qty: clamp(qty, i.max) } : i));

  const remove = variantId => setItems(prev => prev.filter(i => i.variantId !== variantId));
  const clear = () => setItems([]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items, ready, count, subtotal, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}
