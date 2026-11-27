'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

const TABS = [
  ['Dashboard', '/admin'], ['Products', '/admin/products'], ['Orders', '/admin/orders'],
  ['Discounts', '/admin/discounts'], ['Media', '/admin/media'], ['Settings', '/admin/settings'],
  ['Subscribers', '/admin/subscribers'],
];

export default function AdminShell({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [state, setState] = useState('checking');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.replace('/login'); return; }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      setState(p?.role === 'admin' ? 'ok' : 'denied');
    })();
  }, [router]);

  if (state === 'checking') return <p className="px-5 pt-16 text-sm text-stone">Checking access...</p>;
  if (state === 'denied') {
    return (
      <div className="mx-auto max-w-md px-5 pt-16">
        <h1 className="font-display text-3xl">Not authorised</h1>
        <p className="mt-4 text-sm text-stone">This area is for store administrators only.</p>
        <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">Back to the shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-8">
      <nav aria-label="Admin" className="mb-8 flex gap-5 overflow-x-auto whitespace-nowrap border-b border-black/10 pb-3 text-sm">
        {TABS.map(([label, href]) => (
          <Link key={href} href={href}
            className={`underline-offset-4 ${path === href ? 'font-medium underline' : 'text-stone hover:underline'}`}>{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
    }
