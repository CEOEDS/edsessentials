'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    // Always show the same message so nobody can use this page to discover which emails have accounts
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-sm px-5 pt-16">
      <h1 className="font-display text-4xl">Reset password</h1>
      {sent ? (
        <p className="mt-8 text-sm text-stone">If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" aria-label="Email"
            className="w-full border border-black/20 px-3 py-2 text-sm" />
          <button disabled={busy} className="w-full bg-black py-3 text-sm text-white disabled:opacity-50">
            {busy ? 'Please wait...' : 'Send reset link'}
          </button>
        </form>
      )}
    </div>
  );
}
