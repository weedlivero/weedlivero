
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch('/api/admin-session', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Sessione non valida');
        }

        const data = await response.json();

        if (!data.authenticated) {
          throw new Error('Accesso non autorizzato');
        }

        if (!controller.signal.aborted) {
          setStatus('authenticated');
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setStatus('unauthenticated');
        router.replace('/admin/login');
      }
    }

    checkSession();

    return () => controller.abort();
  }, [router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p>
          {status === 'checking'
            ? 'Verifica sessione amministratore...'
            : 'Reindirizzamento al login...'}
        </p>
      </div>
    );
  }

  return children;
}
