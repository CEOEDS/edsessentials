'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace('/login'); return; }
      setUser(data.user);
      const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', data.user.id).maybeSingle();
      setName(profile?.full_name || '');
      setPhone(profile?.phone || '');
      setLoading(false);
    })();
  }, [router]);

  async function save(e) {
    e.preventDefault();
    setMsg('');
    const { error } = await supabase.from('profiles').update({ full_name: name, phone }).eq('id', user.id);
    setMsg(error ? 'Could not save. Please try again.' : 'Saved.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) return <p className="px-5 pt-16 text-sm text-stone">Loading...</p>;

  const field = 'w-full border border-black/20 px-3 py-2 text-sm';

  return (
    <div className="mx-auto max-w-md px-5 pt-16">
      <h1 className="font-display text-4xl">My account</h1>
      <p className="mt-2 text-sm text-stone">{user.email}</p>

      <form onSubmit={save} className="mt-8 space-y-4">
        <label className="block text-sm">Full name
          <input value={name} onChange={e => setName(e.target.value)} className={`${field} mt-1`} />
        </label>
        <label className="block text-sm">Phone number
          <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" className={`${field} mt-1`} />
        </label>
        <button className="bg-black px-6 py-3 text-sm text-white">Save details</button>
        {msg && <p role="status" className="text-sm text-stone">{msg}</p>}
      </form>

      <ul className="mt-10 space-y-3 text-sm">
        <li><Link href="/account/addresses" className="underline underline-offset-4">Saved addresses</Link></li>
      </ul>

      <button onClick={signOut} className="mt-10 border border-black px-6 py-3 text-sm">Sign out</button>
    </div>
  );
}
