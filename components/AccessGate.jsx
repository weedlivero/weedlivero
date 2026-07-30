'use client';

import Image from 'next/image';
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

  if (!checked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-emerald-950 px-5">
        <p className="text-sm font-bold text-white/70">
          Caricamento...
        </p>
      </main>
    );
  }

  if (allowed) {
    return children;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-emerald-950 px-5 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/70 p-7 text-center shadow-2xl backdrop-blur-xl"
      >
        <Image
          src="/logo-weedlivero.png"
          alt="Weedlivero"
          width={520}
          height={520}
          priority
          className="mx-auto h-auto w-full max-w-[280px]"
        />

        <p className="mt-5 text-sm leading-relaxed text-white/70">
          Inserisci il codice di accesso per entrare nel catalogo
          privato.
        </p>

        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Codice di accesso"
          autoComplete="off"
          className="mt-6 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center text-lg font-semibold text-white outline-none placeholder:text-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
        />

        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-400">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-950/50 transition active:scale-[0.98]"
        >
          Entra
        </button>
      </form>
    </main>
  );
}