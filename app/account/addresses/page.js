'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
const EMPTY = { full_name: '', phone: '', street: '', city_lga: '', state: '' };

export default function Addresses() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(uid) {
    const { data } = await supabase.from('addresses').select('*').eq('user_id', uid)
      .order('is_default', { ascending: false }).order('created_at', { ascending: false });
    setList(data || []);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace('/login'); return; }
      setUserId(data.user.id);
      await load(data.user.id);
      setLoading(false);
    })();
  }, [router]);

  async function add(e) {
    e.preventDefault();
    setMsg('');
    const { error } = await supabase.from('addresses').insert({ ...form, user_id: userId, is_default: list.length === 0 });
    if (error) { setMsg('Could not save the address. Please check every box.'); return; }
    setForm(EMPTY);
    await load(userId);
  }

  async function remove(id) {
    await supabase.from('addresses').delete().eq('id', id);
    await load(userId);
  }

  async function makeDefault(id) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    await load(userId);
  }

  if (loading) return <p className="px-5 pt-16 text-sm text-stone">Loading...</p>;

  const field = 'w-full border border-black/20 px-3 py-2 text-sm';
  const set = key => e => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="mx-auto max-w-lg px-5 pt-16">
      <Link href="/account" className="text-sm underline underline-offset-4">Back to my account</Link>
      <h1 className="mt-4 font-display text-4xl">Saved addresses</h1>

      <ul className="mt-8 space-y-4">
        {list.length === 0 && <li className="text-sm text-stone">No saved addresses yet.</li>}
        {list.map(a => (
          <li key={a.id} className="border border-black/15 p-4 text-sm">
            <p className="font-medium">{a.full_name} {a.is_default && <span className="ml-2 bg-cream px-2 py-0.5 text-xs">Default</span>}</p>
            <p className="text-stone">{a.street}, {a.city_lga}, {a.state}</p>
            <p className="text-stone">{a.phone}</p>
            <div className="mt-3 flex gap-4">
              {!a.is_default && <button onClick={() => makeDefault(a.id)} className="underline underline-offset-4">Make default</button>}
              <button onClick={() => remove(a.id)} className="underline underline-offset-4">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 font-display text-2xl">Add an address</h2>
      <form onSubmit={add} className="mt-4 space-y-3">
        <input required value={form.full_name} onChange={set('full_name')} placeholder="Full name" aria-label="Full name" className={field} />
        <input required value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="Phone number" aria-label="Phone number" className={field} />
        <input required value={form.street} onChange={set('street')} placeholder="Street address" aria-label="Street address" className={field} />
        <input required value={form.city_lga} onChange={set('city_lga')} placeholder="City or LGA" aria-label="City or LGA" className={field} />
        <select required value={form.state} onChange={set('state')} aria-label="State" className={`${field} bg-white`}>
          <option value="">Select state</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="bg-black px-6 py-3 text-sm text-white">Save address</button>
        {msg && <p role="alert" className="text-sm text-stone">{msg}</p>}
      </form>
    </div>
  );
}
