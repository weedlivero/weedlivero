'use client';

import { useEffect, useState } from 'react';

export default function AccessGate({ children }) {
  const [code, setCode] = useState('');
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAllowed(localStorage.getItem('weedlivero_access') === 'ok');
  }, []);

  function submit(e) {
    e.preventDefault();
    const validCode = process.env.NEXT_PUBLIC_ACCESS_CODE || 'WEED2026';

    if (code.trim() === validCode) {
      localStorage.setItem('weedlivero_access', 'ok');
      setAllowed(true);
      setError('');
    } else {
      setError('Codice non valido.');
    }
  }

  if (allowed) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-brand-soft to-emerald-100 px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green text-3xl font-black text-white">W</div>
        <h1 className="text-3xl font-black tracking-tight">Weedlivero</h1>
        <p className="mt-2 text-gray-500">Inserisci il codice di accesso per entrare nel catalogo privato.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Codice di accesso"
          className="mt-6 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-brand-green"
        />
        {error ? <p className="mt-3 text-sm font-semibold text-red-500">{error}</p> : null}
        <button className="mt-5 w-full rounded-2xl bg-brand-green px-5 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition hover:scale-[1.01]">
          Entra
        </button>
      </form>
    </main>
  );
}
