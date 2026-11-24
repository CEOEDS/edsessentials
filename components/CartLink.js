'use client';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartLink() {
  const cart = useCart();
  return (
    <Link href="/cart" className="text-sm hover:underline underline-offset-4">
      Cart{cart.ready && cart.count > 0 ? ` (${cart.count})` : ''}
    </Link>
  );
}
