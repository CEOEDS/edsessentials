'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, formatPrice } from '../../../lib/supabase';

const FLAGS = [['is_best_seller', 'Best'], ['is_new_arrival', 'New'], ['is_trending', 'Trend'], ['is_active', 'Visible']];

export default function Products() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const { data } = await supabase.from('products')
      .select('id, name, collection, price_ngn, is_best_seller, is_new_arrival, is_trending, is_active, product_variants(stock_quantity, reserved_quantity)')
      .order('created_at', { ascending: false });
    setRows(data || []);
  }
  useEffect(() => { load(); }, []);

  async function flip(p, key) {
    const { error } = await supabase.from('products').update({ [key]: !p[key] }).eq('id', p.id);
    setMsg(error ? error.message : '');
    load();
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}" and all its sizes and photos? This cannot be undone.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    setMsg(error ? error.message : '');
    load();
  }

  if (!rows) return <p className="text-sm text-stone">Loading...</p>;
  const shown = rows.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Products</h1>
        <Link href="/admin/products/new" className="bg-black px-5 py-2 text-sm text-white">Add product</Link>
      </div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" aria-label="Search products"
        className="mt-6 w-full max-w-sm border-b border-black/30 py-1 text-sm outline-none" />
      {msg && <p role="alert" className="mt-3 text-sm text-stone">{msg}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/20"><th className="py-2">Name</th><th>Collection</th><th>Price</th><th>In stock</th><th>Flags</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map(p => (
              <tr key={p.id} className="border-b border-black/10 align-top">
                <td className="py-3 pr-3"><Link href={`/admin/products/${p.id}`} className="underline underline-offset-4">{p.name}</Link></td>
                <td className="pr-3">{p.collection}</td>
                <td className="price pr-3">{formatPrice(p.price_ngn)}</td>
                <td className="pr-3">{p.product_variants.reduce((n, v) => n + v.stock_quantity - v.reserved_quantity, 0)}</td>
                <td className="pr-3">
                  <div className="flex flex-wrap gap-1">
                    {FLAGS.map(([key, label]) => (
                      <button key={key} onClick={() => flip(p, key)} aria-pressed={p[key]}
                        className={`border px-2 py-0.5 text-xs ${p[key] ? 'border-black bg-black text-white' : 'border-black/20 text-stone'}`}>{label}</button>
                    ))}
                  </div>
                </td>
                <td><button onClick={() => remove(p)} className="text-xs underline underline-offset-4">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="py-8 text-sm text-stone">No products found.</p>}
      </div>
    </div>
  );
    }
