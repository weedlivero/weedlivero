'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRequestList } from '@/lib/requestList';

export default function RequestListBar() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    function loadProducts() {
      setProducts(getRequestList());
    }

    function handleUpdatedList(event) {
      const updatedProducts = event?.detail?.products;

      if (Array.isArray(updatedProducts)) {
        setProducts(updatedProducts);
        return;
      }

      loadProducts();
    }

    loadProducts();

    window.addEventListener(
      'weedlivero-request-list-updated',
      handleUpdatedList
    );

    window.addEventListener('storage', loadProducts);

    return () => {
      window.removeEventListener(
        'weedlivero-request-list-updated',
        handleUpdatedList
      );

      window.removeEventListener('storage', loadProducts);
    };
  }, []);

  const count = products.length;

  if (count === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <Link
        href="/request-list"
        className="flex items-center justify-between gap-4 rounded-2xl bg-gray-900 px-5 py-4 text-white shadow-2xl transition active:scale-[0.98]"
      >
        <div>
          <p className="text-sm font-black">
            📋 {count}{' '}
            {count === 1
              ? 'prodotto selezionato'
              : 'prodotti selezionati'}
          </p>

          <p className="mt-1 text-xs text-gray-300">
            Tocca per vedere la lista
          </p>
        </div>

        <span className="text-sm font-black">
          Apri →
        </span>
      </Link>
    </div>
  );
}