
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const ACCESS_STORAGE_KEY = 'weedlivero_access';

export default function Header({ title = 'Weedlivero' }) {
  const [authenticated, setAuthenticated] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch('/api/customer/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Verifica sessione non disponibile');
        }

        const data = await response.json();

        if (active) {
          setAuthenticated(data.authenticated === true);
        }
      } catch (error) {
        console.error('Errore verifica sessione:', error);
        if (active) setAuthenticated(null);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch('/api/customer/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Revoca della sessione non riuscita');
      }

      try {
        window.localStorage.removeItem(ACCESS_STORAGE_KEY);
      } catch (error) {
        console.warn('Impossibile rimuovere accesso locale:', error);
      }

      setAuthenticated(false);
      window.location.assign('/');
    } catch (error) {
      console.error('Errore durante la disconnessione:', error);
      window.alert('Non è stato possibile terminare la sessione. Riprova.');
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/70 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link
          href="/"
          className="min-w-0 transition hover:opacity-90"
          aria-label="Torna alla Home"
        >
          <Image
            src="/logo-weedlivero.png"
            alt="Weedlivero"
            width={260}
            height={80}
            priority
            className="h-auto w-36 sm:w-52"
          />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <span className="wl-badge hidden px-3 py-2 text-xs sm:inline-flex sm:text-sm">
            {title}
          </span>

          {authenticated === true ? (
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="rounded-full border border-emerald-200 bg-white/80 px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:opacity-60 sm:px-4 sm:text-sm"
            >
              {loggingOut ? 'Uscita...' : 'Esci'}
            </button>
          ) : authenticated === false ? (
            <Link
              href="/access"
              className="rounded-full border border-emerald-200 bg-white/80 px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 sm:px-4 sm:text-sm"
            >
              Accedi
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
