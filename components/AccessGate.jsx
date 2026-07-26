'use client';

import { useEffect, useState } from 'react';

const ACCESS_STORAGE_KEY = 'weedlivero_access';

export default function AccessGate({ children }) {
  const [code, setCode] = useState('');
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const savedAccess =
        window.localStorage.getItem(ACCESS_STORAGE_KEY);

      setAllowed(savedAccess === 'ok');
    } catch (storageError) {
      console.warn(
        'LocalStorage non disponibile nel browser corrente:',
        storageError
      );

      /*
       * Se Telegram limita localStorage, mostriamo comunque
       * regolarmente la schermata del codice.
       */
      setAllowed(false);
    } finally {
      setChecked(true);
    }
  }, []);

  function submit(event) {
    event.preventDefault();

    const validCode =
      process.env.NEXT_PUBLIC_ACCESS_CODE || 'WEED2026';

    if (code.trim() !== validCode) {
      setError('Codice non valido.');
      return;
    }

    try {
      window.localStorage.setItem(ACCESS_STORAGE_KEY, 'ok');
    } catch (storageError) {
      console.warn(
        'Impossibile salvare l’accesso nel browser corrente:',
        storageError
      );
    }

    setAllowed(true);
    setError('');
  }

  /*
   * Evita che Next.js mostri una schermata incoerente
   * mentre controlliamo l’accesso salvato.
   */
  if (!checked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-brand-soft to-emerald-100 px-5">
        <p className="text-sm font-bold text-gray-500">
          Caricamento...
        </p>
      </main>
    );
  }

  if (allowed) {
    return children;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-brand-soft to-emerald-100 px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-soft"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green text-3xl font-black text-white">
          W
        </div>

        <h1 className="text-3xl font-black tracking-tight">
          Weedlivero
        </h1>

        <p className="mt-2 text-gray-500">
          Inserisci il codice di accesso per entrare nel catalogo
          privato.
        </p>

        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Codice di accesso"
          autoComplete="off"
          className="mt-6 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-brand-green"
        />

        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-500">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-5 w-full rounded-2xl bg-brand-green px-5 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition active:scale-[0.98]"
        >
          Entra
        </button>
      </form>
    </main>
  );
}