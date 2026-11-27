'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { uploadMedia } from '../../../../lib/media';

const COLLECTIONS = ['men', 'women', 'unisex', 'accessories'];
const SIZES = ['S', 'M', 'L', 'XL', 'One Size'];
const BLANK = {
  name: '', slug: '', description: '', collection: 'unisex', category_id: '', price_ngn: '', price_usd: '',
  is_best_seller: false, is_new_arrival: false, is_trending: false, is_active: true,
};
const field = 'w-full border border-black/20 px-3 py-2 text-sm';

export default function EditProduct() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === 'new';
  const [p, setP] = useState(BLANK);
  const [cats, setCats] = useState([]);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [removedV, setRemovedV] = useState([]);
  const [removedI, setRemovedI] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(isNew);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('categories').select('id, name').order('sort_order');
      setCats(c || []);
      if (isNew) return;
      const { data } = await supabase.from('products')
        .select('*, product_variants(id, size, color, stock_quantity, reserved_quantity), product_images(id, url, alt, sort_order)')
        .eq('id', id).maybeSingle();
      if (!data) { setMsg('Product not found.'); return; }
      const { product_variants, product_images, ...rest } = data;
      setP({ ...rest, category_id: rest.category_id || '', price_usd: rest.price_usd ?? '' });
      setVariants(product_variants);
      setImages([...product_images].sort((a, b) => a.sort_order - b.sort_order));
      setReady(true);
    })();
  }, [id, isNew]);

  const set = key => e => setP({ ...p, [key]: e.target.value });
  const tick = key => e => setP({ ...p, [key]: e.target.checked });

  async function addFiles(e) {
    const files = [...e.target.files];
    setMsg('Uploading...');
    try {
      const added = [];
      for (const f of files) {
        if (!f.type.startsWith('image/')) throw new Error('Only pictures can be added here.');
        added.push({ url: await uploadMedia(f, 'products'), alt: '' });
      }
      setImages(prev => [...prev, ...added]);
      setMsg('');
    } catch (err) { setMsg(err.message); }
    e.target.value = '';
  }

  const makeMain = i => setImages(prev => [prev[i], ...prev.filter((_, n) => n !== i)]);
  const dropImage = i => {
    if (images[i].id) setRemovedI(r => [...r, images[i].id]);
    setImages(prev => prev.filter((_, n) => n !== i));
  };
  const addVariant = () => setVariants(v => [...v, { size: 'M', color: '', stock_quantity: 0 }]);
  const setVariant = (i, key, val) => setVariants(v => v.map((x, n) => (n === i ? { ...x, [key]: val } : x)));
  const dropVariant = i => {
    if (variants[i].id) setRemovedV(r => [...r, variants[i].id]);
    setVariants(v => v.filter((_, n) => n !== i));
  };

  const fail = error => { setMsg(error.message); setBusy(false); };

  async function save(e) {
    e.preventDefault();
    setMsg('');
    if (images.length === 0 || variants.length === 0) { setMsg('Add at least one photo and one size and colour.'); return; }
    if (variants.some(v => !v.color.trim())) { setMsg('Every size needs a colour.'); return; }
    setBusy(true);
    const slug = (p.slug || p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const row = {
      name: p.name.trim(), slug, description: p.description, collection: p.collection,
      category_id: p.category_id || null, price_ngn: Number(p.price_ngn),
      price_usd: p.price_usd === '' ? null : Number(p.price_usd),
      is_best_seller: p.is_best_seller, is_new_arrival: p.is_new_arrival, is_trending: p.is_trending, is_active: p.is_active,
    };
    let pid = id;
    if (isNew) {
      const { data, error } = await supabase.from('products').insert(row).select('id').single();
      if (error) return fail(error);
      pid = data.id;
    } else {
      const { error } = await supabase.from('products').update(row).eq('id', id);
      if (error) return fail(error);
    }
    if (removedV.length) await supabase.from('product_variants').delete().in('id', removedV);
    if (removedI.length) await supabase.from('product_images').delete().in('id', removedI);

    for (const v of variants) {
      const base = { size: v.size, color: v.color.trim(), stock_quantity: Number(v.stock_quantity) || 0 };
      const res = v.id
        ? await supabase.from('product_variants').update(base).eq('id', v.id)
        : await supabase.from('product_variants').insert({
            ...base, product_id: pid,
            sku: `${slug}-${base.size}-${base.color}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase().replace(/\s+/g, ''),
          });
      if (res.error) return fail(res.error);
    }
    for (let i = 0; i < images.length; i++) {
      const im = images[i];
      const res = im.id
        ? await supabase.from('product_images').update({ sort_order: i }).eq('id', im.id)
        : await supabase.from('product_images').insert({ product_id: pid, url: im.url, alt: p.name, sort_order: i });
      if (res.error) return fail(res.error);
    }
    window.location.assign(`/admin/products/${pid}`);
  }

  async function remove() {
    if (!confirm('Delete this product and all its sizes and photos? This cannot be undone.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) setMsg(error.message); else router.replace('/admin/products');
  }

  if (!ready) return <p className="text-sm text-stone">{msg || 'Loading...'}</p>;

  return (
    <form onSubmit={save} className="max-w-2xl pb-16">
      <Link href="/admin/products" className="text-sm underline underline-offset-4">Back to products</Link>
      <h1 className="mt-4 font-display text-4xl">{isNew ? 'Add product' : 'Edit product'}</h1>

      <div className="mt-8 space-y-3">
        <input required value={p.name} onChange={set('name')} placeholder="Product name" aria-label="Product name" className={field} />
        <textarea required value={p.description} onChange={set('description')} rows={5} placeholder="Description" aria-label="Description" className={field} />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Price (₦)
            <input required type="number" min="0" step="0.01" value={p.price_ngn} onChange={set('price_ngn')} className={`${field} mt-1`} />
          </label>
          <label className="text-sm">Price (USD, optional)
            <input type="number" min="0" step="0.01" value={p.price_usd} onChange={set('price_usd')} className={`${field} mt-1`} />
          </label>
          <label className="text-sm">Collection
            <select value={p.collection} onChange={set('collection')} className={`${field} mt-1 bg-white`}>
              {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm">Category
            <select value={p.category_id} onChange={set('category_id')} className={`${field} mt-1 bg-white`}>
              <option value="">None</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-5 pt-2 text-sm">
          <label><input type="checkbox" checked={p.is_best_seller} onChange={tick('is_best_seller')} /> Best Seller</label>
          <label><input type="checkbox" checked={p.is_new_arrival} onChange={tick('is_new_arrival')} /> New Arrival</label>
          <label><input type="checkbox" checked={p.is_trending} onChange={tick('is_trending')} /> Trending</label>
          <label><input type="checkbox" checked={p.is_active} onChange={tick('is_active')} /> Visible in shop</label>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl">Photos</h2>
      <p className="mt-1 text-xs text-stone">The first photo is the main one. Pictures are shrunk automatically.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {images.map((im, i) => (
          <div key={im.url} className="w-24 text-xs">
            <div className="relative h-32 w-24 bg-cream"><Image src={im.url} alt="" fill unoptimized className="object-cover" /></div>
            {i === 0 ? <p className="mt-1">Main photo</p> : <button type="button" onClick={() => makeMain(i)} className="mt-1 underline">Make main</button>}
            <button type="button" onClick={() => dropImage(i)} className="block underline">Remove</button>
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" multiple onChange={addFiles} className="mt-4 text-sm" aria-label="Add photos" />

      <h2 className="mt-10 font-display text-2xl">Sizes, colours and stock</h2>
      <div className="mt-3 space-y-2">
        {variants.map((v, i) => (
          <div key={v.id || i} className="flex items-center gap-2">
            <select value={v.size} onChange={e => setVariant(i, 'size', e.target.value)} aria-label="Size" className="border border-black/20 bg-white px-2 py-2 text-sm">
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={v.color} onChange={e => setVariant(i, 'color', e.target.value)} placeholder="Colour" aria-label="Colour" className="min-w-0 flex-1 border border-black/20 px-3 py-2 text-sm" />
            <input type="number" min="0" value={v.stock_quantity} onChange={e => setVariant(i, 'stock_quantity', e.target.value)} aria-label="Stock" className="w-20 border border-black/20 px-3 py-2 text-sm" />
            <button type="button" onClick={() => dropVariant(i)} className="text-xs underline">Remove</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addVariant} className="mt-3 border border-black px-4 py-2 text-sm">Add size and colour</button>

      {msg && <p role="alert" className="mt-6 text-sm text-stone">{msg}</p>}
      <div className="mt-8 flex items-center gap-6">
        <button disabled={busy} className="bg-black px-8 py-3 text-sm text-white disabled:opacity-50">{busy ? 'Saving...' : 'Save product'}</button>
        {!isNew && <button type="button" onClick={remove} className="text-sm underline underline-offset-4">Delete product</button>}
      </div>
    </form>
  );
                                         }
