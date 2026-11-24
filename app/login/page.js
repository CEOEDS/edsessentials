'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else router.push('/account');
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) setMsg(error.message);
      else if (data.session) router.push('/account');
      else setMsg('Check your email for a confirmation link, then come back and sign in.');
    }
    setBusy(false);
  }

  const field = 'w-full border border-black/20 px-3 py-2 text-sm';

  return (
    <div className="mx-auto max-w-sm px-5 pt-16">
      <h1 className="font-display text-4xl">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === 'signup' && (
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full name" aria-label="Full name" className={field} />
        )}
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className={field} />
        <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (8+ characters)" aria-label="Password" className={field} />
        <button disabled={busy} className="w-full bg-black py-3 text-sm text-white disabled:opacity-50">
          {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
        {msg && <p role="alert" className="text-sm text-stone">{msg}</p>}
      </form>
      <div className="mt-6 space-y-2 text-sm">
        <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(''); }} className="underline underline-offset-4">
          {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
        {mode === 'signin' && (
          <p><Link href="/forgot-password" className="underline underline-offset-4">Forgot your password?</Link></p>
        )}
      </div>
    </div>
  );
}
