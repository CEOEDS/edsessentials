'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const CONTACT_FIELDS = [
  ['contact_email', 'Support email'],
  ['contact_whatsapp', 'WhatsApp number (with country code)'],
  ['social_instagram', 'Instagram link'],
  ['social_tiktok', 'TikTok link'],
  ['social_x', 'X link'],
];

export default function Settings() {
  const [rates, setRates] = useState([]);
  const [threshold, setThreshold] = useState('');
  const [contact, setContact] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from('shipping_rates').select('*').order('state');
      setRates(r || []);
      const { data: s } = await supabase.from('store_settings').select('value').eq('key', 'free_shipping_threshold_ngn').maybeSingle();
      setThreshold(String(s?.value ?? ''));
      const { data: c } = await supabase.from('store_settings').select('key, value').in('key', CONTACT_FIELDS.map(f => f[0]));
      const obj = {};
      (c || []).forEach(row => { obj[row.key] = typeof row.value === 'string' ? row.value : ''; });
      setContact(obj);
    })();
  }, []);

  const setRate = (state, key, val) => setRates(rs => rs.map(r => (r.state === state ? { ...r, [key]: val } : r)));

  async function save(e) {
    e.preventDefault();
    setMsg('');
    const a = await supabase.from('shipping_rates').upsert(rates.map(r => ({ state: r.state, fee_ngn: Number(r.fee_ngn) || 0, is_active: r.is_active })));
    const rows = [
      { key: 'free_shipping_threshold_ngn', value: Number(threshold) || 0 },
      ...CONTACT_FIELDS.map(([key]) => ({ key, value: (contact[key] || '').trim() })),
    ];
    const b = await supabase.from('store_settings').upsert(rows);
    setMsg(a.error?.message || b.error?.message || 'Saved. The website footer updates within a minute.');
  }

  return (
    <form onSubmit={save} className="max-w-xl pb-16">
      <h1 className="font-display text-4xl">Settings</h1>

      <h2 className="mt-8 font-display text-2xl">Free delivery</h2>
      <label className="mt-2 block text-sm">Orders of this value or more get free delivery (₦). Enter 0 to switch it off.
        <input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className="mt-1 w-full border border-black/20 px-3 py-2 text-sm" />
      </label>

      <h2 className="mt-8 font-display text-2xl">Contact and social links</h2>
      <div className="mt-3 space-y-3">
        {CONTACT_FIELDS.map(([key, label]) => (
          <label key={key} className="block text-sm">{label}
            <input type="text" value={contact[key] || ''} onChange={e => setContact(c => ({ ...c, [key]: e.target.value }))} className="mt-1 w-full border border-black/20 px-3 py-2 text-sm" />
          </label>
        ))}
      </div>

      <h2 className="mt-8 font-display text-2xl">Delivery fee by state</h2>
      <div className="mt-3 space-y-2">
        {rates.map(r => (
          <div key={r.state} className="flex items-center gap-3 text-sm">
            <span className="w-32">{r.state}</span>
            <input type="number" min="0" value={r.fee_ngn} onChange={e => setRate(r.state, 'fee_ngn', e.target.value)} aria-label={`Fee for ${r.state}`} className="w-32 border border-black/20 px-3 py-1" />
            <label><input type="checkbox" checked={r.is_active} onChange={e => setRate(r.state, 'is_active', e.target.checked)} /> We deliver here</label>
          </div>
        ))}
      </div>

      <button className="mt-8 bg-black px-8 py-3 text-sm text-white">Save settings</button>
      {msg && <p role="status" className="mt-4 text-sm text-stone">{msg}</p>}

      <h2 className="mt-12 font-display text-2xl">Payment gateways</h2>
      <p className="mt-2 text-sm text-stone">Your Paystack and Flutterwave keys are kept as private settings on your hosting account, not in this dashboard, so nobody can read them from the website. We set them up together, one at a time.</p>
    </form>
  );
  }
