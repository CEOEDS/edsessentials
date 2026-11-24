'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });
    // 23505 means this email is already on the list, which we treat as success
    if (!error || error.code === '23505') { setStatus('done'); setEmail(''); }
    else setStatus('error');
  }

  if (status === 'done') return <p className="text-sm text-cream">Thank you. You&apos;re on the list.</p>;

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm gap-2">
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Your email" aria-label="Email address"
        className="min-w-0 flex-1 border border-white/30 bg-transparent px-3 py-2 text-sm text-cream placeholder:text-ash" />
      <button disabled={status === 'loading'} className="bg-cream px-4 py-2 text-sm text-black disabled:opacity-50">
        {status === 'loading' ? '...' : 'Subscribe'}
      </button>
      {status === 'error' && <span role="alert" className="self-center text-xs text-ash">Try again</span>}
    </form>
  );
}
