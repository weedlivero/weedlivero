'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem('weedlivero_admin') === 'ok';

    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="p-6 text-center">Caricamento...</div>;
  }

  return children;
}