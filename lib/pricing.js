import { adminClient } from './supabaseAdmin';

export const MAX_LINES = 20;
export const MAX_QTY = 10;

// Accepts only well-formed {variantId, qty} items from the browser; everything else is rejected.
export function cleanItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) return null;
  const merged = new Map();
  for (const r of raw) {
    const id = typeof r?.variantId === 'string' ? r.variantId : '';
    const qty = Number(r?.qty);
    if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
    merged.set(id, Math.min((merged.get(id) || 0) + qty, MAX_QTY));
  }
  return [...merged].map(([variantId, qty]) => ({ variantId, qty }));
}

const round2 = n => Math.round(n * 100) / 100;

export async function computeTotals({ items, state, code }) {
  const db = adminClient();
  const ids = items.map(i => i.variantId);
  const { data: variants, error } = await db
    .from('product_variants')
    .select('id, size, color, product_id, products(id, name, price_ngn, is_active)')
    .in('id', ids);
  if (error || !variants || variants.length !== ids.length) return { error: 'Some items are no longer available.' };

  const lines = [];
  for (const it of items) {
    const v = variants.find(x => x.id === it.variantId);
    if (!v || !v.products || !v.products.is_active) return { error: 'Some items are no longer available.' };
    const unit = Number(v.products.price_ngn);
    lines.push({
      variant_id: v.id, product_id: v.product_id, name: v.products.name,
      size: v.size, color: v.color, unit_price: unit, quantity: it.qty, line_total: round2(unit * it.qty),
    });
  }
  const subtotal = round2(lines.reduce((n, l) => n + l.line_total, 0));

  const { data: setting } = await db.from('store_settings').select('value').eq('key', 'free_shipping_threshold_ngn').maybeSingle();
  const threshold = Number(setting?.value ?? 0);
  let shipping = 0;
  if (state) {
    const { data: rate } = await db.from('shipping_rates').select('fee_ngn').eq('state', state).eq('is_active', true).maybeSingle();
    if (!rate) return { error: 'We cannot deliver to that state yet.' };
    shipping = threshold > 0 && subtotal >= threshold ? 0 : Number(rate.fee_ngn);
  }

  let discount = 0;
  let appliedCode = null;
  let codeMessage = null;
  const wanted = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (wanted) {
    const { data: dc } = await db.from('discount_codes').select('*').eq('code', wanted).eq('is_active', true).maybeSingle();
    const now = Date.now();
    const valid = dc
      && (!dc.starts_at || new Date(dc.starts_at).getTime() <= now)
      && (!dc.expires_at || new Date(dc.expires_at).getTime() > now)
      && (dc.max_uses == null || dc.used_count < dc.max_uses)
      && subtotal >= Number(dc.min_order_ngn);
    if (valid) {
      discount = dc.kind === 'percent' ? round2((subtotal * Number(dc.value)) / 100) : Math.min(Number(dc.value), subtotal);
      appliedCode = dc.code;
    } else {
      codeMessage = 'That code is not valid for this order.';
    }
  }

  const total = round2(Math.max(subtotal - discount, 0) + shipping);
  return { lines, subtotal, shipping, discount, total, code: appliedCode, codeMessage };
}
