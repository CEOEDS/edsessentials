import { createClient } from '@supabase/supabase-js';

// Public (anon) client. Row Level Security in Supabase decides what visitors can read.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// One place for the currency so USD and others can be added later.
export const formatPrice = (n, currency = 'NGN') =>
  new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(n);

export const PRODUCT_FIELDS =
  'id, slug, name, price_ngn, collection, is_best_seller, is_new_arrival, is_trending, product_images(url, alt, sort_order), product_variants(stock_quantity, reserved_quantity)';
