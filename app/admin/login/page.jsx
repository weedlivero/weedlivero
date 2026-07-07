'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok || !result.success) {
      setError(result.error || 'Codice non valido');
      return;
    }

    localStorage.setItem('weedlivero_admin', 'ok');
    router.push('/admin');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-green-50 px-5">
      <form
        onSubmit={login}
        className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-md"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-green-600 text-3xl text-white">
          🔐
        </div>

        <h1 className="text-3xl font-black text-gray-900">
          Admin Weedlivero
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Inserisci il codice amministratore.
        </p>

        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Codice admin"
          className="mt-6 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-lg font-bold outline-none focus:border-green-500"
        />

        {error ? (
          <p className="mt-3 text-sm font-bold text-red-500">
            {error}
          </p>
        ) : null}

        <button
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-green-600 p-4 text-lg font-black text-white shadow-lg shadow-green-200 active:scale-[0.98]"
        >
          {loading ? 'Controllo...' : 'Entra'}
        </button>
      </form>
    </main>
  );
}