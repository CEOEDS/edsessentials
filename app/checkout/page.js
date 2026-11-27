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
  const [provider, setProvider] = useState('paystack');
  const [rates, setRates] = useState({});
  const [threshold, setThreshold] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cart.ready && cart.items.length === 0) router.replace('/cart');
  }, [cart.ready, cart.items.length, router]);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        setSignedIn(true);
        const { data: addr } = await supabase.from('addresses').select('*').eq('user_id', user.user.id)
          .order('is_default', { ascending: false }).limit(1).maybeSingle();
        setForm(f => ({
          ...f,
          email: user.user.email || '',
          ...(addr ? { full_name: addr.full_name, phone: addr.phone, street: addr.street, city_lga: addr.city_lga, state: addr.state } : {}),
        }));
      }
      const { data: r } = await supabase.from('shipping_rates').select('state, fee_ngn');
      setRates(Object.fromEntries((r || []).map(x => [x.state, Number(x.fee_ngn)])));
      const { data: s } = await supabase.from('store_settings').select('value').eq('key', 'free_shipping_threshold_ngn').maybeSingle();
      setThreshold(Number(s?.value ?? 0));
    })();
  }, []);

  if (!cart.ready || cart.items.length === 0) return <p className="px-5 pt-16 text-sm text-stone">Loading...</p>;

  const field = 'w-full border border-black/20 px-3 py-2 text-sm';
  const set = key => e => setForm({ ...form, [key]: e.target.value });

  // Estimate for display only. The server works out the real amount.
  const known = form.state && rates[form.state] !== undefined;
  const fee = known ? (threshold > 0 && cart.subtotal >= threshold ? 0 : rates[form.state]) : null;
  const total = cart.subtotal + (fee ?? 0);

  async function pay(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...form, provider, items: cart.items.map(i => ({ variantId: i.variantId, qty: i.qty })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 pt-16 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl">Checkout</h1>
        <p className="mt-2 text-sm text-stone">
          {signedIn ? 'Signed in. Your saved address is filled in below.' : (<>Checking out as a guest. <Link href="/login" className="underline underline-offset-4">Sign in</Link> to use saved addresses.</>)}
        </p>
        <form onSubmit={pay} className="mt-8 space-y-3">
          <input type="email" required value={form.email} onChange={set('email')} placeholder="Email" aria-label="Email" className={field} />
          <input required value={form.full_name} onChange={set('full_name')} placeholder="Full name" aria-label="Full name" className={field} />
          <input required value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="Phone number" aria-label="Phone number" className={field} />
          <input required value={form.street} onChange={set('street')} placeholder="Street address" aria-label="Street address" className={field} />
          <input required value={form.city_lga} onChange={set('city_lga')} placeholder="City or LGA" aria-label="City or LGA" className={field} />
          <select required value={form.state} onChange={set('state')} aria-label="State" className={`${field} bg-white`}>
            <option value="">Select state</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <fieldset className="pt-2">
            <legend className="mb-2 text-sm">Pay with</legend>
            <div className="flex gap-3 text-sm">
              {[['paystack', 'Paystack'], ['flutterwave', 'Flutterwave']].map(([id, label]) => (
                <label key={id} className={`flex-1 cursor-pointer border px-3 py-2 text-center ${provider === id ? 'border-black bg-black text-white' : 'border-black/20'}`}>
                  <input type="radio" name="provider" value={id} checked={provider === id} onChange={() => setProvider(id)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <button disabled={busy} className="mt-2 w-full bg-black py-3 text-sm text-white disabled:opacity-50">
            {busy ? 'Please wait...' : `Pay ${formatPrice(total)}`}
          </button>
          {error && <p role="alert" className="text-sm text-stone">{error}</p>}
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
          <p className="flex justify-between text-stone"><span>Delivery</span><span>{fee === null ? 'Choose a state' : fee === 0 ? 'Free' : formatPrice(fee)}</span></p>
          <p className="flex justify-between font-medium"><span>Total</span><span className="price">{formatPrice(total)}</span></p>
        </div>
        <Link href="/cart" className="mt-6 inline-block text-sm underline underline-offset-4">Back to cart</Link>
      </div>
    </div>
  );
}
