import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { settlePayment } from '../../../../lib/payments';

export const dynamic = 'force-dynamic';

function validSignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get('x-paystack-signature'))) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch { return new NextResponse('Bad request', { status: 400 }); }

  const reference = event?.data?.reference;
  const eventKey = `${event?.event}:${reference || event?.data?.id}`;
  const db = adminClient();

  // Record the event once. A duplicate that was already processed is acknowledged and ignored.
  const { error: insertErr } = await db.from('webhook_events').insert({
    provider: 'paystack', event_key: eventKey, event_type: event?.event, payload: event,
  });
  if (insertErr) {
    if (insertErr.code !== '23505') return new NextResponse('Error', { status: 500 });
    const { data: existing } = await db.from('webhook_events').select('processed_at')
      .eq('provider', 'paystack').eq('event_key', eventKey).maybeSingle();
    if (existing?.processed_at) return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    if (event.event === 'charge.success' && reference) {
      await settlePayment(reference); // asks Paystack directly; never trusts this message alone
    }
    await db.from('webhook_events').update({ processed_at: new Date().toISOString() })
      .eq('provider', 'paystack').eq('event_key', eventKey);
    return NextResponse.json({ ok: true });
  } catch {
    // Not marked processed, so Paystack's retry will be handled again
    return new NextResponse('Error', { status: 500 });
  }
}
