'use client';
import { useState } from 'react';
import Image from 'next/image';
import { formatPrice } from '../../../lib/supabase';

export default function ProductView({ product }) {
  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const variants = product.product_variants;
  const sizes = [...new Set(variants.map(v => v.size))];
  const colors = [...new Set(variants.map(v => v.color))];
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(sizes[0]);
  const [color, setColor] = useState(colors[0]);
  const [qty, setQty] = useState(1);

  const v = variants.find(x => x.size === size && x.color === color);
  const left = v ? v.stock_quantity - v.reserved_quantity : 0;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 pt-10 md:grid-cols-2">
      <div>
        <div className="relative aspect-[4/5] bg-cream">
          <Image src={images[img].url} alt={images[img].alt || product.name} fill unoptimized className="object-cover" />
        </div>
        <div className="mt-3 flex gap-2">
          {images.map((im, i) => (
            <button key={im.url} onClick={() => setImg(i)} aria-label={`Show image ${i + 1}`}
              className={`relative h-20 w-16 bg-cream ${i === img ? 'ring-2 ring-black' : ''}`}>
              <Image src={im.url} alt="" fill unoptimized className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h1 className="font-display text-4xl">{product.name}</h1>
        <p className="price mt-2 text-xl">{formatPrice(product.price_ngn)}</p>
        <p className="mt-5 leading-relaxed text-stone">{product.description}</p>

        <fieldset className="mt-8"><legend className="mb-2 text-sm">Colour: {color}</legend>
          <div className="flex flex-wrap gap-2">{colors.map(c => (
            <button key={c} onClick={() => setColor(c)} aria-pressed={c === color}
              className={`border px-4 py-2 text-sm ${c === color ? 'border-black bg-black text-white' : 'border-black/20'}`}>{c}</button>))}
          </div>
        </fieldset>

        <fieldset className="mt-6"><legend className="mb-2 text-sm">Size</legend>
          <div className="flex flex-wrap gap-2">{sizes.map(s => {
            const vv = variants.find(x => x.size === s && x.color === color);
            const out = !vv || vv.stock_quantity - vv.reserved_quantity <= 0;
            return (<button key={s} onClick={() => setSize(s)} aria-pressed={s === size}
              className={`border px-4 py-2 text-sm ${s === size ? 'border-black bg-black text-white' : 'border-black/20'} ${out ? 'line-through opacity-50' : ''}`}>{s}</button>);
          })}</div>
        </fieldset>

        <p className="mt-5 text-sm">{left > 0 ? (left <= 5 ? `Only ${left} left` : 'In stock') : 'Sold out in this size and colour'}</p>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center border border-black/20">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2" aria-label="Decrease quantity">−</button>
            <span className="w-8 text-center text-sm">{qty}</span>
            <button onClick={() => setQty(Math.min(Math.max(left, 1), qty + 1))} className="px-3 py-2" aria-label="Increase quantity">+</button>
          </div>
          <button disabled className="flex-1 bg-black py-3 text-sm text-white opacity-40">Add to Cart (coming in Phase 2)</button>
        </div>
        <p className="mt-8 text-xs text-stone">Size guide: [placeholder] added in a later phase.</p>
      </div>
    </div>
  );
}
