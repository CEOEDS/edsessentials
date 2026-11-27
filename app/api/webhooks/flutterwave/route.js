import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { settlePayment } from '../../../../lib/payments';

export const dynamic = 'force-dynamic';

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Flutterwave signs webhooks with a secret hash that you choose and set in both places.
function validSignature(rawBody, request) {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (!secret) return false;
  const plain = request.headers.get('verif-hash');
  if (plain && safeEqual(plain, secret)) return true;
  const signed = request.headers.get('flutterwave-signature');
  if (signed) {
    const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
    return safeEqual(signed, expected);
  }
  return false;
}

export async function POST(request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request)) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch { return new NextResponse('Bad request', { status: 400 }); }

  const type = event?.event || event?.['event.type'] || 'unknown';
  const reference = event?.data?.tx_ref;
  const eventKey = `${type}:${event?.data?.id || reference}`;
  const db = adminClient();

  // Record the event once. A duplicate that was already processed is acknowledged and ignored.
  const { error: insertErr } = await db.from('webhook_events').insert({
    provider: 'flutterwave', event_key: eventKey, event_type: type, payload: event,
  });
  if (insertErr) {
    if (insertErr.code !== '23505') return new NextResponse('Error', { status: 500 });
    const { data: existing } = await db.from('webhook_events').select('processed_at')
      .eq('provider', 'flutterwave').eq('event_key', eventKey).maybeSingle();
    if (existing?.processed_at) return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    if (reference) {
      await settlePayment(reference); // asks Flutterwave directly; never trusts this message alone
    }
    await db.from('webhook_events').update({ processed_at: new Date().toISOString() })
      .eq('provider', 'flutterwave').eq('event_key', eventKey);
    return NextResponse.json({ ok: true });
  } catch {
    // Not marked processed, so Flutterwave's retry will be handled again
    return new NextResponse('Error', { status: 500 });
  }
}
