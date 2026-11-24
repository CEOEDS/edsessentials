'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function WishlistButton({ productId }) {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: row } = await supabase.from('wishlist_items').select('product_id')
        .eq('user_id', data.user.id).eq('product_id', productId).maybeSingle();
      setSaved(!!row);
    })();
  }, [productId]);

  async function toggle() {
    if (!userId) { router.push('/login'); return; }
    setBusy(true);
    if (saved) {
      await supabase.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', productId);
      setSaved(false);
    } else {
      const { error } = await supabase.from('wishlist_items').insert({ user_id: userId, product_id: productId });
      if (!error) setSaved(true);
    }
    setBusy(false);
  }

  return (
    <button onClick={toggle} disabled={busy} aria-pressed={saved}
      className="border border-black px-6 py-3 text-sm disabled:opacity-50">
      {saved ? '♥ Saved to wishlist' : '♡ Add to wishlist'}
    </button>
  );
}
