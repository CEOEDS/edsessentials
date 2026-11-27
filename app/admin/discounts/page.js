'use client';
import { useEffect, useState } from 'react';
import { supabase, formatPrice } from '../../../lib/supabase';

const BLANK = { code: '', kind: 'percent', value: '', min_order_ngn: '', max_uses: '', expires_at: '' };
const field = 'w-full border border-black/20 px-3 py-2 text-sm';

export default function Discounts() {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState(BLANK);
  const [msg, setMsg] = useState('');

  async function load() {
    const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    setRows(data || []);
  }
  useEffect(() => { load(); }, []);
  const set = key => e => setF({ ...f, [key]: e.target.value });

  async function add(e) {
    e.preventDefault();
    setMsg('');
    const { error } = await supabase.from('discount_codes').insert({
      code: f.code.trim().toUpperCase(), kind: f.kind, value: Number(f.value),
      min_order_ngn: Number(f.min_order_ngn) || 0,
      max_uses: f.max_uses === '' ? null : Number(f.max_uses),
      expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
    });
    if (error) setMsg(error.message); else { setF(BLANK); load(); }
  }
  async function toggle(r) { await supabase.from('discount_codes').update({ is_active: !r.is_active }).eq('id', r.id); load(); }
  async function remove(r) {
    if (!confirm(`Delete code ${r.code}?`)) return;
    await supabase.from('discount_codes').delete().eq('id', r.id);
    load();
  }

  return (
    <div className="max-w-3xl pb-16">
      <h1 className="font-display text-4xl">Discount codes</h1>
      <form onSubmit={add} className="mt-6 grid gap-3 md:grid-cols-2">
        <input required value={f.code} onChange={set('code')} placeholder="Code (e.g. WELCOME10)" aria-label="Code" className={field} />
        <select value={f.kind} onChange={set('kind')} aria-label="Type" className={`${field} bg-white`}>
          <option value="percent">Percent off</option><option value="fixed">Fixed amount off (₦)</option>
        </select>
        <input required type="number" min="1" step="0.01" value={f.value} onChange={set('value')} placeholder={f.kind === 'percent' ? 'Percent (1 to 100)' : 'Amount in ₦'} aria-label="Value" className={field} />
        <input type="number" min="0" value={f.min_order_ngn} onChange={set('min_order_ngn')} placeholder="Minimum order ₦ (optional)" aria-label="Minimum order" className={field} />
        <input type="number" min="1" value={f.max_uses} onChange={set('max_uses')} placeholder="Max uses (optional)" aria-label="Max uses" className={field} />
        <label className="text-sm">Expires (optional)<input type="date" value={f.expires_at} onChange={set('expires_at')} className={`${field} mt-1`} /></label>
        <button className="bg-black px-6 py-3 text-sm text-white md:col-span-2">Create code</button>
        {msg && <p role="alert" className="text-sm text-stone md:col-span-2">{msg}</p>}
      </form>

      <table className="mt-10 w-full text-left text-sm">
        <thead><tr className="border-b border-black/20"><th className="py-2">Code</th><th>Discount</th><th>Used</th><th>Expires</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b border-black/10">
              <td className="py-3">{r.code}</td>
              <td>{r.kind === 'percent' ? `${r.value}%` : formatPrice(r.value)}{Number(r.min_order_ngn) > 0 ? ` over ${formatPrice(r.min_order_ngn)}` : ''}</td>
              <td>{r.used_count}{r.max_uses ? ` / ${r.max_uses}` : ''}</td>
              <td>{r.expires_at ? r.expires_at.slice(0, 10) : 'Never'}</td>
              <td className="space-x-3 text-right">
                <button onClick={() => toggle(r)} className="underline underline-offset-4">{r.is_active ? 'Turn off' : 'Turn on'}</button>
                <button onClick={() => remove(r)} className="underline underline-offset-4">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-6 text-sm text-stone">No codes yet.</p>}
    </div>
  );
    }
