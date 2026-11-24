import { NextResponse } from 'next/server';
import { settlePayment } from '../../../../lib/payments';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const reference = new URL(request.url).searchParams.get('reference');
  if (!reference || reference.length > 100 || !/^[A-Za-z0-9_-]+$/.test(reference)) {
    return NextResponse.json({ state: 'not_found' }, { status: 400 });
  }
  try {
    const result = await settlePayment(reference);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ state: 'pending' }, { status: 500 });
  }
}
