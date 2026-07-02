'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      if (!hasSupabaseConfig) {
        setReady(true);
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push('/admin/login');
      else setReady(true);
    }
    check();
  }, [router]);

  if (!ready) return <div className="p-6 text-center">Caricamento...</div>;
  return children;
}
