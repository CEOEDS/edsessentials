import { adminClient } from './supabaseAdmin';

// Ask the provider directly. We never trust the browser or a redirect.
async function verifyWithProvider(provider, reference) {
  if (provider === 'paystack') {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      cache: 'no-store',
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body || !body.data) return { state: 'pending' };
    const d = body.data;
    if (d.status === 'success') return { state: 'success', amount: Number(d.amount) / 100, currency: d.currency, raw: d };
    if (['failed', 'abandoned', 'reversed'].includes(d.status)) return { state: 'failed', raw: d };
    return { state: 'pending', raw: d };
  }

  const res = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }, cache: 'no-store' }
  );
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.status !== 'success' || !body.data) return { state: 'pending' };
  const d = body.data;
  if (d.status === 'successful') return { state: 'success', amount: Number(d.amount), currency: d.currency, raw: d };
  if (d.status === 'failed') return { state: 'failed', raw: d };
  return { state: 'pending', raw: d };
}

// Safe to call many times for the same reference.
export async function settlePayment(reference) {
  const db = adminClient();
  const { data: pay } = await db
    .from('payments')
    .select('id, provider, order_id, orders(id, order_number, total, currency, status, payment_status)')
    .eq('reference', reference)
    .maybeSingle();
  if (!pay || !pay.orders) return { state: 'not_found' };
  const order = pay.orders;
  if (order.payment_status === 'paid') return { state: 'success', orderNumber: order.order_number };

  const result = await verifyWithProvider(pay.provider, reference);

  if (result.state === 'success') {
    const amountOk = Math.abs(result.amount - Number(order.total)) < 0.01 && result.currency === order.currency;
    if (!amountOk) {
      await db.from('payments').update({ status: 'failed', raw: result.raw }).eq('id', pay.id);
      await db.from('order_status_history').insert({
        order_id: order.id, status: order.status,
        note: 'Payment amount or currency did not match the order. Needs manual review.',
      });
      return { state: 'mismatch', orderNumber: order.order_number };
    }
    await db.from('payments').update({ status: 'success', verified_at: new Date().toISOString(), raw: result.raw }).eq('id', pay.id);
    const { error } = await db.rpc('mark_order_paid', { p_order_id: order.id });
    if (error) throw new Error('Could not record the payment');
    return { state: 'success', orderNumber: order.order_number };
  }

  if (result.state === 'failed') {
    await db.from('payments').update({ status: 'failed', raw: result.raw }).eq('id', pay.id);
    await db.rpc('release_order_stock', { p_order_id: order.id, p_new_status: 'payment_failed' });
    return { state: 'failed', orderNumber: order.order_number };
  }

  return { state: 'pending', orderNumber: order.order_number };
                                                                                                                       }
