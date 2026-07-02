'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function login(e) {
    e.preventDefault();
    if (!hasSupabaseConfig) {
      router.push('/admin');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push('/admin');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-soft px-5">
      <form onSubmit={login} className="w-full max-w-sm rounded-[2rem] bg-white p-7 shadow-soft">
        <h1 className="text-3xl font-black">Admin Weedlivero</h1>
        <p className="mt-2 text-gray-500">Accedi per gestire il catalogo.</p>
        <input className="mt-6 w-full rounded-2xl border p-4" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mt-3 w-full rounded-2xl border p-4" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="mt-3 text-sm font-semibold text-red-500">{error}</p> : null}
        <button className="mt-5 w-full rounded-2xl bg-brand-green p-4 font-bold text-white">Entra</button>
      </form>
    </main>
  );
}
