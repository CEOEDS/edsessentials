'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, PRODUCT_FIELDS } from '../../lib/supabase';
import ProductCard from '../../components/ProductCard';

export default function Wishlist() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace('/login'); return; }
      const { data: rows } = await supabase
        .from('wishlist_items')
        .select(`created_at, products(${PRODUCT_FIELDS})`)
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false });
      setItems((rows || []).map(r => r.products).filter(Boolean));
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <p className="px-5 pt-16 text-sm text-stone">Loading...</p>;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12">
      <h1 className="font-display text-4xl">My wishlist</h1>
      {items.length === 0 ? (
        <p className="py-16 text-sm text-stone">
          Nothing saved yet. <Link href="/shop" className="underline underline-offset-4">Browse the shop</Link>
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {items.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
