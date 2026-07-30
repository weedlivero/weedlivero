'use client';

import Image from 'next/image';
import Link from 'next/link';

const ACCESS_STORAGE_KEY = 'weedlivero_access';

export default function Header({ title = 'Weedlivero' }) {
  function logout() {
    try {
      window.localStorage.removeItem(ACCESS_STORAGE_KEY);
    } catch (storageError) {
      console.warn(
        'Impossibile rimuovere l’accesso dal browser corrente:',
        storageError
      );
    }

    /*
     * Ricarica completamente la Home.
     * In questo modo AccessGate ricontrolla il localStorage
     * e mostra nuovamente la schermata del codice.
     */
    window.location.href = '/';
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

          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-emerald-200 bg-white/80 px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 active:scale-[0.97] sm:px-4 sm:text-sm"
          >
            Esci
          </button>
        </div>
      </div>
    </header>
  );
}