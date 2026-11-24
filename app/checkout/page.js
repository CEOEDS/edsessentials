'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, formatPrice } from '../../lib/supabase';
import { useCart } from '../../components/CartProvider';

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

export default function Checkout() {
  const router = useRouter();
  const cart = useCart();
  const [signedIn, setSignedIn] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '', phone: '', street: '', city_lga: '', state: '' });

  useEffect(() => {
    if (cart.ready && cart.items.length === 0) router.replace('/cart');
  }, [cart.ready, cart.items.length, router]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setSignedIn(true);
      const { data: addr } = await supabase.from('addresses').select('*').eq('user_id', data.user.id)
        .order('is_default', { ascending: false }).limit(1).maybeSingle();
      setForm(f => ({
        ...f,
        email: data.user.email || '',
        ...(addr ? { full_name: addr.full_name, phone: addr.phone, street: addr.street, city_lga: addr.city_lga, state: addr.state } : {}),
      }));
    })();
  }, []);

  if (!cart.ready || cart.items.length === 0) return <p className="px-5 pt-16 text-sm text-stone">Loading...</p>;

  const field = 'w-full border border-black/20 px-3 py-2 text-sm';
  const set = key => e => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 pt-16 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl">Checkout</h1>
        <p className="mt-2 text-sm text-stone">
          {signedIn ? 'Signed in. Your saved address is filled in below.' : (<>Checking out as a guest. <Link href="/login" className="underline underline-offset-4">Sign in</Link> to use saved addresses.</>)}
        </p>
        <form onSubmit={e => e.preventDefault()} className="mt-8 space-y-3">
          <input type="email" required value={form.email} onChange={set('email')} placeholder="Email" aria-label="Email" className={field} />
          <input required value={form.full_name} onChange={set('full_name')} placeholder="Full name" aria-label="Full name" className={field} />
          <input required value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="Phone number" aria-label="Phone number" className={field} />
          <input required value={form.street} onChange={set('street')} placeholder="Street address" aria-label="Street address" className={field} />
          <input required value={form.city_lga} onChange={set('city_lga')} placeholder="City or LGA" aria-label="City or LGA" className={field} />
          <select required value={form.state} onChange={set('state')} aria-label="State" className={`${field} bg-white`}>
            <option value="">Select state</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button disabled className="mt-2 w-full bg-black py-3 text-sm text-white opacity-40">Pay now (coming in Phase 3)</button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-2xl">Order summary</h2>
        <ul className="mt-6 space-y-3 text-sm">
          {cart.items.map(i => (
            <li key={i.variantId} className="flex justify-between gap-4">
              <span>{i.name} <span className="text-stone">({i.color} / {i.size}) x {i.qty}</span></span>
              <span className="price">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-1 border-t border-black/10 pt-4 text-sm">
          <p className="flex justify-between"><span>Subtotal</span><span className="price">{formatPrice(cart.subtotal)}</span></p>
          <p className="flex justify-between text-stone"><span>Delivery</span><span>Calculated in Phase 3</span></p>
        </div>
        <Link href="/cart" className="mt-6 inline-block text-sm underline underline-offset-4">Back to cart</Link>
      </div>
    </div>
  );
}
