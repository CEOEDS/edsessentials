'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../../components/CartProvider';

function Result() {
  const params = useSearchParams();
  const reference = params.get('reference');
  const cart = useCart();
  const clearRef = useRef(cart.clear);
  clearRef.current = cart.clear;
  const [state, setState] = useState('checking');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (!reference) { setState('not_found'); return undefined; }
    let tries = 0;
    let timer;
    let stopped = false;

    async function check() {
      try {
        const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`, { cache: 'no-store' });
        const data = await res.json();
        if (stopped) return;
        if (data.orderNumber) setOrderNumber(data.orderNumber);
        if (data.state === 'success') { clearRef.current(); setState('success'); return; }
        if (data.state === 'failed' || data.state === 'mismatch' || data.state === 'not_found') { setState(data.state); return; }
      } catch {}
      tries += 1;
      if (tries < 8) timer = setTimeout(check, 2500);
      else if (!stopped) setState('pending');
    }

    check();
    return () => { stopped = true; clearTimeout(timer); };
  }, [reference]);

  const box = 'mx-auto max-w-md px-5 pt-16';

  if (state === 'checking') {
    return <div className={box}><h1 className="font-display text-4xl">Confirming payment</h1><p className="mt-6 text-sm text-stone">Please wait while we confirm your payment. Do not close this page.</p></div>;
  }
  if (state === 'success') {
    return (
      <div className={box}>
        <h1 className="font-display text-4xl">Thank you</h1>
        <p className="mt-6 text-sm">Your payment was received. Your order number is <strong>{orderNumber}</strong>.</p>
        <p className="mt-2 text-sm text-stone">Keep this number to track your order.</p>
        <Link href="/shop" className="mt-8 inline-block bg-black px-6 py-3 text-sm text-white">Continue shopping</Link>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div className={box}>
        <h1 className="font-display text-4xl">Payment not completed</h1>
        <p className="mt-6 text-sm text-stone">Your payment did not go through and you have not been charged. Your cart is still saved.</p>
        <Link href="/cart" className="mt-8 inline-block bg-black px-6 py-3 text-sm text-white">Back to cart</Link>
      </div>
    );
  }
  if (state === 'mismatch') {
    return (
      <div className={box}>
        <h1 className="font-display text-4xl">We need to check your payment</h1>
        <p className="mt-6 text-sm text-stone">The amount received did not match your order{orderNumber ? ` (${orderNumber})` : ''}. Please contact us on WhatsApp or by email and we will sort it out.</p>
      </div>
    );
  }
  if (state === 'pending') {
    return (
      <div className={box}>
        <h1 className="font-display text-4xl">Still waiting</h1>
        <p className="mt-6 text-sm text-stone">Your bank has not confirmed the payment yet. If you were charged, your order will be confirmed automatically in a few minutes. You can also contact us with your order number{orderNumber ? ` (${orderNumber})` : ''}.</p>
      </div>
    );
  }
  return <div className={box}><h1 className="font-display text-4xl">Order not found</h1><p className="mt-6 text-sm text-stone">We could not find that payment. Please contact us if you were charged.</p></div>;
}

export default function PaymentComplete() {
  return (
    <Suspense fallback={<p className="px-5 pt-16 text-sm text-stone">Loading...</p>}>
      <Result />
    </Suspense>
  );
                           }
