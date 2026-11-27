'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, formatPrice } from '../../../lib/supabase';

const STATUSES = ['pending_payment', 'payment_failed', 'cancelled', 'confirmed', 'processing', 'packaged', 'dispatched', 'delivered', 'returned', 'refunded'];

export default function Orders() {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase.from('orders')
      .select('id, order_number, email, full_name, total, status, payment_status, created_at')
      .order('created_at', { ascending: false }).limit(300)
      .then(({ data }) => setRows(data || []));
  }, []);

  if (!rows) return <p className="text-sm text-stone">Loading...</p>;
  const term = q.toLowerCase();
  const shown = rows.filter(o =>
    (!status || o.status === status) &&
    (!term || o.order_number.toLowerCase().includes(term) || o.email.toLowerCase().includes(term) || o.full_name.toLowerCase().includes(term)));

  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search order no, email or name" aria-label="Search orders"
          className="w-64 border-b border-black/30 py-1 outline-none" />
        <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status" className="border border-black/20 bg-white px-2 py-1">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-black/20"><th className="py-2">Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
          <tbody>
            {shown.map(o => (
              <tr key={o.id} className="border-b border-black/10">
                <td className="py-3 pr-3"><Link href={`/admin/orders/${o.id}`} className="underline underline-offset-4">{o.order_number}</Link></td>
                <td className="pr-3">{o.full_name}<br /><span className="text-xs text-stone">{o.email}</span></td>
                <td className="price pr-3">{formatPrice(o.total)}</td>
                <td className="pr-3">{o.status.replace('_', ' ')}</td>
                <td className="pr-3">{o.payment_status}</td>
                <td>{o.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="py-8 text-sm text-stone">No orders yet.</p>}
      </div>
    </div>
  );
    }
