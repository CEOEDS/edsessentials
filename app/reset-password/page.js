'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase reads the secure link from the email and starts a short recovery session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMsg(error.message);
    else setDone(true);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-sm px-5 pt-16">
      <h1 className="font-display text-4xl">New password</h1>
      {done ? (
        <p className="mt-8 text-sm text-stone">Your password has been changed. <Link href="/account" className="underline underline-offset-4">Go to my account</Link></p>
      ) : !ready ? (
        <p className="mt-8 text-sm text-stone">Open this page from the link in your reset email. If the link has expired, <Link href="/forgot-password" className="underline underline-offset-4">request a new one</Link>.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="New password (8+ characters)" aria-label="New password" className="w-full border border-black/20 px-3 py-2 text-sm" />
          <button disabled={busy} className="w-full bg-black py-3 text-sm text-white disabled:opacity-50">
            {busy ? 'Please wait...' : 'Save new password'}
          </button>
          {msg && <p role="alert" className="text-sm text-stone">{msg}</p>}
        </form>
      )}
    </div>
  );
}
