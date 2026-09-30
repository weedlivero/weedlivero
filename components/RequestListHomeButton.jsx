'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRequestList } from '@/lib/requestList';

export default function RequestListHomeButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function updateCount() {
      setCount(getRequestList().length);
    }

    updateCount();

    window.addEventListener(
      'weedlivero-request-list-updated',
      updateCount
    );

    window.addEventListener(
      'storage',
      updateCount
    );

    return () => {
      window.removeEventListener(
        'weedlivero-request-list-updated',
        updateCount
      );

      window.removeEventListener(
        'storage',
        updateCount
      );
    };
  }, []);

  return (
    <Link
      href="/request-list"
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-white px-5 py-4 text-base font-black text-emerald-700 transition active:scale-[0.98]"
    >
      <span aria-hidden="true">📋</span>
      Il tuo carrello ({count})
    </Link>
  );
}