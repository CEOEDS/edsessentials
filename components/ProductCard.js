import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '../lib/supabase';

export default function ProductCard({ p }) {
  const imgs = [...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const inStock = (p.product_variants || []).some(v => v.stock_quantity - v.reserved_quantity > 0);
  return (
    <Link href={`/product/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        {imgs[0] && <Image src={imgs[0].url} alt={imgs[0].alt || p.name} fill unoptimized
          sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />}
        {!inStock && <span className="absolute left-2 top-2 bg-black px-2 py-1 text-xs text-white">Sold out</span>}
      </div>
      <p className="mt-3 text-sm">{p.name}</p>
      <p className="price text-sm text-stone">{formatPrice(p.price_ngn)}</p>
    </Link>
  );
}
