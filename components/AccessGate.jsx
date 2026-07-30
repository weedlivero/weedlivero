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
      <main className="flex min-h-screen items-center justify-center px-5">
        <p className="text-sm font-bold text-emerald-800/60">
          Caricamento...
        </p>
      </main>
    );
  }

  if (allowed) {
    return children;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />

        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-lime-200/35 blur-3xl" />

        <div className="absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-green-200/30 blur-3xl" />
      </div>

      <form
        onSubmit={submit}
        className="wl-card relative z-10 w-full max-w-sm rounded-[2rem] p-7 text-center sm:p-8"
      >
        <div className="mx-auto flex min-h-[180px] items-center justify-center">
          <Image
            src="/logo-weedlivero.png"
            alt="Weedlivero"
            width={520}
            height={520}
            priority
            className="h-auto w-full max-w-[280px] drop-shadow-[0_18px_30px_rgba(6,95,70,0.12)]"
          />
        </div>

        <div className="mx-auto mt-2 h-px w-20 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        <p className="mt-5 text-sm leading-relaxed text-gray-600">
          Inserisci il codice di accesso per entrare nel catalogo privato.
        </p>

        <input
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);

            if (error) {
              setError('');
            }
          }}
          placeholder="Codice di accesso"
          autoComplete="off"
          autoCapitalize="characters"
          className="wl-input mt-6 px-4 py-4 text-center text-lg font-semibold placeholder:text-gray-400"
        />

        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-500">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="wl-button-primary mt-5 w-full px-5 py-4 text-lg"
        >
          Entra
        </button>

        <p className="mt-5 text-xs font-medium text-gray-400">
          Accesso riservato
        </p>
      </form>
    </main>
  );
}