'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function AdminUsersDashboardCard() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    let active = true;
    fetch('/api/admin/customers', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('Non autorizzato'); return r.json(); })
      .then(data => { if (active) setCount((data.users || []).filter(u => u.approval_status === 'pending').length); })
      .catch(() => { if (active) setCount(null); });
    return () => { active = false; };
  }, []);
  return <Link href="/admin/users" className="rounded-3xl bg-amber-50 p-6 shadow-md transition hover:shadow-lg">
    <p className="text-sm font-bold text-amber-700">Gestione utenti</p>
    <p className="mt-2 text-3xl font-black text-amber-800">{count === null ? '—' : count}</p>
    <p className="mt-1 text-sm text-amber-700">Registrazioni in attesa →</p>
  </Link>;
}
