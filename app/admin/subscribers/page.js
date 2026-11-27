'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function Subscribers() {
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('newsletter_subscribers').select('id, email, created_at').order('created_at', { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, []);

  async function copyAll() {
    try { await navigator.clipboard.writeText(rows.map(r => r.email).join(', ')); setMsg('All emails copied.'); }
    catch { setMsg('Could not copy. Please copy them by hand.'); }
  }

  if (!rows) return <p className="text-sm text-stone">Loading...</p>;

  return (
    <div className="max-w-xl pb-16">
      <h1 className="font-display text-4xl">Newsletter subscribers</h1>
      <p className="mt-2 text-sm text-stone">{rows.length} subscriber{rows.length === 1 ? '' : 's'}</p>
      <button onClick={copyAll} className="mt-4 border border-black px-5 py-2 text-sm">Copy all emails</button>
      {msg && <p role="status" className="mt-3 text-sm text-stone">{msg}</p>}
      <ul className="mt-6 divide-y divide-black/10 text-sm">
        {rows.map(r => <li key={r.id} className="flex justify-between py-2"><span>{r.email}</span><span className="text-stone">{r.created_at.slice(0, 10)}</span></li>)}
      </ul>
    </div>
  );
        }
