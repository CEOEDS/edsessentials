'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../components/CartProvider';
import { formatPrice } from '../../lib/supabase';

export default function CartPage() {
  const cart = useCart();

  if (!cart.ready) return <p className="px-5 pt-16 text-sm text-stone">Loading...</p>;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-16">
        <h1 className="font-display text-4xl">Your cart</h1>
        <p className="mt-6 text-sm text-stone">Your cart is empty. <Link href="/shop" className="underline underline-offset-4">Browse the shop</Link></p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-16">
      <h1 className="font-display text-4xl">Your cart</h1>
      <ul className="mt-8 divide-y divide-black/10">
        {cart.items.map(i => (
          <li key={i.variantId} className="flex gap-4 py-5">
            <Link href={`/product/${i.slug}`} className="relative h-28 w-24 shrink-0 bg-cream">
              {i.image && <Image src={i.image} alt={i.name} fill unoptimized className="object-cover" />}
            </Link>
            <div className="flex-1 text-sm">
              <p className="font-medium">{i.name}</p>
              <p className="text-stone">{i.color} / {i.size}</p>
              <p className="price mt-1">{formatPrice(i.price)}</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center border border-black/20">
                  <button onClick={() => cart.setQty(i.variantId, i.qty - 1)} className="px-3 py-1" aria-label="Decrease quantity">−</button>
                  <span className="w-8 text-center">{i.qty}</span>
                  <button onClick={() => cart.setQty(i.variantId, i.qty + 1)} className="px-3 py-1" aria-label="Increase quantity">+</button>
                </div>
                <button onClick={() => cart.remove(i.variantId)} className="underline underline-offset-4">Remove</button>
              </div>
              {i.qty >= i.max && <p className="mt-2 text-xs text-stone">Maximum available in stock</p>}
            </div>
            <p className="price text-sm">{formatPrice(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 border-t border-black/10 pt-6 text-sm">
        <p className="flex justify-between"><span>Subtotal</span><span className="price">{formatPrice(cart.subtotal)}</span></p>
        <p className="mt-1 text-xs text-stone">Delivery is added at checkout.</p>
        <Link href="/checkout" className="mt-6 block bg-black py-3 text-center text-white">Proceed to checkout</Link>
      </div>
    </div>
  );
}
