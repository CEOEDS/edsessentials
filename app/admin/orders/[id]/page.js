'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase, formatPrice } from '../../../../lib/supabase';

const STATUSES = ['pending_payment', 'payment_failed', 'cancelled', 'confirmed', 'processing', 'packaged', 'dispatched', 'delivered', 'returned', 'refunded'];
const UNPAID_OK = ['pending_payment', 'payment_failed', 'cancelled'];

export default function OrderDetail() {
  const { id } = useParams();
  const [o, setO] = useState(null);
  const [items, setItems] = useState([]);
  const [pays, setPays] = useState([]);
  const [hist, setHist] = useState([]);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [a, b, c, d] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', id),
      supabase.from('payments').select('*').eq('order_id', id).order('created_at'),
      supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false }),
    ]);
    setO(a.data); setItems(b.data || []); setPays(c.data || []); setHist(d.data || []);
    if (a.data) setStatus(a.data.status);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function update(e) {
    e.preventDefault();
    setMsg('');
    if (o.payment_status !== 'paid' && !UNPAID_OK.includes(status)) { setMsg('This order has not been paid, so it cannot move to that status.'); return; }
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { setMsg(error.message); return; }
    await supabase.from('order_status_history').insert({ order_id: id, status, note: note || null });
    setNote('');
    setMsg('Status updated.');
    load();
  }

  if (!o) return <p className="text-sm text-stone">Loading...</p>;

  return (
    <div className="max-w-3xl pb-16">
      <Link href="/admin/orders" className="text-sm underline underline-offset-4">Back to orders</Link>
      <h1 className="mt-4 font-display text-4xl">{o.order_number}</h1>
      <p className="mt-1 text-sm text-stone">{o.created_at.slice(0, 16).replace('T', ' ')} · {o.payment_status} · {o.status.replace('_', ' ')}</p>

      <div className="mt-8 grid gap-8 text-sm md:grid-cols-2">
        <section>
          <h2 className="font-display text-xl">Customer</h2>
          <p className="mt-2">{o.full_name}</p>
          <p>{o.email}</p>
          <p>{o.phone}</p>
        </section>
        <section>
          <h2 className="font-display text-xl">Deliver to</h2>
          <p className="mt-2">{o.street}</p>
          <p>{o.city_lga}, {o.state}</p>
        </section>
      </div>

      <h2 className="mt-10 font-display text-xl">Items</h2>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {items.map(i => (
            <tr key={i.id} className="border-b border-black/10">
              <td className="py-2">{i.name} <span className="text-stone">({i.color} / {i.size}) x {i.quantity}</span></td>
              <td className="price py-2 text-right">{formatPrice(i.line_total)}</td>
            </tr>
          ))}
          <tr><td className="pt-3 text-stone">Subtotal</td><td className="price pt-3 text-right">{formatPrice(o.subtotal)}</td></tr>
          <tr><td className="text-stone">Delivery</td><td className="price text-right">{formatPrice(o.shipping_fee)}</td></tr>
          {Number(o.discount_amount) > 0 && <tr><td className="text-stone">Discount {o.discount_code}</td><td className="price text-right">-{formatPrice(o.discount_amount)}</td></tr>}
          <tr><td className="pt-1 font-medium">Total</td><td className="price pt-1 text-right font-medium">{formatPrice(o.total)}</td></tr>
        </tbody>
      </table>

      <h2 className="mt-10 font-display text-xl">Payments</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {pays.length === 0 && <li className="text-stone">No payment attempts.</li>}
        {pays.map(p => <li key={p.id}>{p.provider} · {p.status} · {formatPrice(p.amount)} · <span className="text-xs text-stone">{p.reference}</span></li>)}
      </ul>

      <h2 className="mt-10 font-display text-xl">Update status</h2>
      <form onSubmit={update} className="mt-3 space-y-3">
        <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Status" className="w-full border border-black/20 bg-white px-3 py-2 text-sm">
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional, e.g. tracking number)" aria-label="Note" className="w-full border border-black/20 px-3 py-2 text-sm" />
        <button className="bg-black px-6 py-3 text-sm text-white">Save status</button>
        {msg && <p role="status" className="text-sm text-stone">{msg}</p>}
      </form>

      <h2 className="mt-10 font-display text-xl">History</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {hist.map(h => <li key={h.id}>{h.created_at.slice(0, 16).replace('T', ' ')} · {h.status.replace('_', ' ')}{h.note ? ` · ${h.note}` : ''}</li>)}
      </ul>
    </div>
  );
    }
