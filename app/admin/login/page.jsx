
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

    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Codice non valido');
        return;
      }

      // La sessione viene creata dal server.
      // Non utilizziamo più localStorage.
      setCode('');

      router.replace('/admin');
      router.refresh();
    } catch (err) {
      console.error('Errore login amministratore:', err);

      setError(
        'Impossibile effettuare il login. Riprova.'
      );
    } finally {
      setLoading(false);
    }
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

        <h1 className="text-2xl font-black text-gray-900">
          Weedlivero Admin
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Inserisci il codice amministratore per accedere.
        </p>

        <div className="mt-6 text-left">
          <label
            htmlFor="admin-code"
            className="mb-2 block text-sm font-bold text-gray-700"
          >
            Codice amministratore
          </label>

          <input
            id="admin-code"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Inserisci il codice"
            autoComplete="current-password"
            required
            disabled={loading}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="mt-6 w-full rounded-2xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>

        <p className="mt-5 text-xs text-gray-400">
          Area riservata agli amministratori
        </p>
      </form>
    </main>
  );
}
