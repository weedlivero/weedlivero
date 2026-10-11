
'use client';

import { useState } from 'react';

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin-logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Logout non riuscito');
      }

      try {
        localStorage.removeItem('weedlivero_admin');
      } catch {
        // Il cookie amministrativo è già stato eliminato.
      }

      window.location.replace('/admin/login');
    } catch (err) {
      console.error('Errore logout admin:', err);
      setError('Logout non riuscito. Riprova.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full lg:mt-5 lg:border-t lg:border-gray-100 lg:pt-4">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-label="Esci dall'amministrazione"
        className="flex w-full flex-col items-center justify-center rounded-2xl bg-red-50 px-2 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 lg:block lg:px-4 lg:py-3 lg:text-sm"
      >
        <span className="lg:hidden">🚪</span>
        <span>
          {loading ? 'Uscita...' : 'Esci'}
        </span>
      </button>

      {error && (
        <p className="mt-2 text-center text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
