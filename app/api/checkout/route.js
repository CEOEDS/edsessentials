import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { adminClient } from '../../../lib/supabaseAdmin';
import { cleanItems, computeTotals } from '../../../lib/pricing';

export const dynamic = 'force-dynamic';

const str = (v, max) => (typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null);
const fail = (error, status) => NextResponse.json({ error }, { status });

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return fail('Invalid request.', 400); }

  const items = cleanItems(body?.items);
  const email = str(body?.email, 254);
  const full_name = str(body?.full_name, 120);
  const phone = str(body?.phone, 30);
  const street = str(body?.street, 250);
  const city_lga = str(body?.city_lga, 120);
  const state = str(body?.state, 60);
  const provider = body?.provider === 'paystack' || body?.provider === 'flutterwave' ? body.provider : null;

  if (!items || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !full_name || !phone || !street || !city_lga || !state || !provider) {
    return fail('Please complete every field.', 400);
  }

  const db = adminClient();

  // Optional: link the order to a signed-in customer
  let userId = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const { data } = await db.auth.getUser(authHeader.slice(7));
    userId = data?.user?.id ?? null;
  }

  await db.rpc('expire_stale_reservations');

  // Prices, delivery and discounts are always worked out here, never trusted from the browser
  const totals = await computeTotals({ items, state, code: body?.code });
  if (totals.error) return fail(totals.error, 400);
  if (totals.total <= 0) return fail('This order has nothing to pay.', 400);

  const { data: order, error: orderErr } = await db.from('orders').insert({
    user_id: userId, email, full_name, phone, street, city_lga, state, currency: 'NGN',
    subtotal: totals.subtotal, shipping_fee: totals.shipping, discount_amount: totals.discount,
    total: totals.total, discount_code: totals.code,
  }).select('id, order_number').single();
  if (orderErr || !order) return fail('Could not create your order. Please try again.', 500);

  const { error: itemsErr } = await db.from('order_items').insert(totals.lines.map(l => ({ ...l, order_id: order.id })));
  if (itemsErr) {
    await db.from('orders').delete().eq('id', order.id);
    return fail('Could not create your order. Please try again.', 500);
  }

  // Hold the stock. If another customer just took the last one, this is refused.
  const { error: reserveErr } = await db.rpc('reserve_order_stock', { p_order_id: order.id, p_minutes: 30 });
  if (reserveErr) {
    await db.from('orders').delete().eq('id', order.id);
    return fail('Sorry, one of the items in your cart has just sold out. Please check your cart.', 409);
  }

  const reference = `${order.order_number}-${randomBytes(4).toString('hex')}`;
  const { error: payErr } = await db.from('payments').insert({
    order_id: order.id, provider, reference, amount: totals.total, currency: 'NGN', status: 'initiated',
  });
  if (payErr) {
    await db.rpc('release_order_stock', { p_order_id: order.id, p_new_status: 'cancelled' });
    return fail('Could not start the payment. Please try again.', 500);
  }

  const origin = process.env.SITE_URL || process.env.URL || new URL(request.url).origin;
  const returnUrl = `${origin}/payment/complete?reference=${encodeURIComponent(reference)}`;

  let url = null;
  try {
    if (provider === 'paystack') {
      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, amount: Math.round(totals.total * 100), currency: 'NGN', reference,
          callback_url: returnUrl, metadata: { order_number: order.order_number },
        }),
      });
      const json = await res.json().catch(() => null);
      url = json?.data?.authorization_url || null;
    } else {
      const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_ref: reference, amount: totals.total, currency: 'NGN', redirect_url: returnUrl,
          customer: { email, name: full_name, phonenumber: phone },
          customizations: { title: "ED'S ESSENTIALS" },
          meta: { order_number: order.order_number },
        }),
      });
      const json = await res.json().catch(() => null);
      url = json?.data?.link || null;
    }
  } catch {
    url = null;
  }

  if (!url) {
    await db.from('payments').update({ status: 'failed' }).eq('reference', reference);
    await db.rpc('release_order_stock', { p_order_id: order.id, p_new_status: 'payment_failed' });
    return fail('We could not reach the payment provider. Please try again.', 502);
  }

  return NextResponse.json({ url, orderNumber: order.order_number });
    }
