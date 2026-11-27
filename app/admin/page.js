'use client';
import { useEffect, useState } from 'react';
import { supabase, formatPrice } from '../../lib/supabase';

const sum = (a, f) => a.reduce((n, x) => n + Number(f(x)), 0);

function Stat({ label, value }) {
  return (
    <div className="border border-black/10 p-4">
      <p className="text-xs text-stone">{label}</p>
      <p className="price mt-1 text-xl">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);

  useEffect(() => {
    (async () => {
      const [paid, open, failed, low, items] = await Promise.all([
        supabase.from('orders').select('total, created_at').eq('payment_status', 'paid'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'processing', 'packaged']),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
        supabase.from('product_variants').select('id, size, color, stock_quantity, reserved_quantity, products(name)').lte('stock_quantity', 3).order('stock_quantity').limit(20),
        supabase.from('order_items').select('name, quantity, line_total, orders!inner(payment_status)').eq('orders.payment_status', 'paid'),
      ]);
      const orders = paid.data || [];
      const since = Date.now() - 30 * 864e5;
      const recent = orders.filter(o => new Date(o.created_at).getTime() >= since);
      const byDay = {};
      recent.forEach(o => { const k = o.created_at.slice(0, 10); byDay[k] = (byDay[k] || 0) + Number(o.total); });
      const top = {};
      (items.data || []).forEach(i => {
        top[i.name] = top[i.name] || { qty: 0, rev: 0 };
        top[i.name].qty += i.quantity;
        top[i.name].rev += Number(i.line_total);
      });
      setD({
        revenue: sum(orders, o => o.total), count: orders.length,
        revenue30: sum(recent, o => o.total), count30: recent.length,
        open: open.count || 0, failed: failed.count || 0,
        days: Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])),
        top: Object.entries(top).sort((a, b) => b[1].rev - a[1].rev).slice(0, 8),
        low: low.data || [],
      });
    })();
  }, []);

  if (!d) return <p className="text-sm text-stone">Loading...</p>;

  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Revenue, all time" value={formatPrice(d.revenue)} />
        <Stat label="Paid orders, all time" value={d.count} />
        <Stat label="Revenue, last 30 days" value={formatPrice(d.revenue30)} />
        <Stat label="Paid orders, last 30 days" value={d.count30} />
        <Stat label="Orders to fulfil" value={d.open} />
        <Stat label="Failed payments" value={d.failed} />
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Sales by day (last 30 days)</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {d.days.length === 0 && <tr><td className="py-2 text-stone">No paid orders yet.</td></tr>}
              {d.days.map(([day, total]) => (
                <tr key={day} className="border-b border-black/10"><td className="py-2">{day}</td><td className="price py-2 text-right">{formatPrice(total)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-display text-2xl">Top products</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {d.top.length === 0 && <tr><td className="py-2 text-stone">No sales yet.</td></tr>}
              {d.top.map(([name, v]) => (
                <tr key={name} className="border-b border-black/10">
                  <td className="py-2">{name} <span className="text-stone">x {v.qty}</span></td>
                  <td className="price py-2 text-right">{formatPrice(v.rev)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Low stock (3 or fewer)</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {d.low.length === 0 && <tr><td className="py-2 text-stone">Nothing is running low.</td></tr>}
            {d.low.map(v => (
              <tr key={v.id} className="border-b border-black/10">
                <td className="py-2">{v.products?.name} <span className="text-stone">({v.color} / {v.size})</span></td>
                <td className="py-2 text-right">{v.stock_quantity - v.reserved_quantity} left</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
     }
