'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import TelegramButton from '@/components/TelegramButton';
import {
  clearRequestList,
  getRequestList,
  removeProductFromRequestList,
} from '@/lib/requestList';

function getCategoryFallback(category) {
  switch (category) {
    case 'weed':
      return '🌿';
    case 'hash':
      return '🟫';
    case 'concentrate':
      return '💧';
    case 'edibles':
      return '🍬';
    case 'vapes':
      return '💨';
    default:
      return '📦';
  }
}

export default function RequestListPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setProducts(getRequestList());
  }, []);

  function removeProduct(productId) {
    const nextProducts = removeProductFromRequestList(productId);
    setProducts(nextProducts);
  }

  function clearList() {
    const confirmed = window.confirm(
      'Vuoi svuotare tutta la lista?'
    );

    if (!confirmed) {
      return;
    }

    clearRequestList();
    setProducts([]);
  }

  return (
    <>
      <Header title="Lista prodotti" />

      <main className="mx-auto max-w-3xl px-5 pb-32 pt-6">
        <Link
          href="/"
          className="text-sm font-bold text-gray-500 transition hover:text-green-700"
        >
          ← Torna al catalogo
        </Link>

        <div className="mt-6">
          <h1 className="text-4xl font-black text-gray-900">
            La tua lista
          </h1>

          <p className="mt-2 text-gray-500">
            {products.length === 1
              ? '1 prodotto selezionato'
              : `${products.length} prodotti selezionati`}
          </p>
        </div>

        {products.length === 0 ? (
          <section className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">📋</div>

            <h2 className="mt-4 text-2xl font-black text-gray-900">
              La lista è vuota
            </h2>

            <p className="mt-2 text-gray-500">
              Aggiungi uno o più prodotti dal catalogo.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-2xl bg-green-600 px-6 py-3 font-black text-white"
            >
              Apri il catalogo
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-8 space-y-4">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-3xl"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {getCategoryFallback(product.category)}
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${product.id}`}
                      className="block"
                    >
                      <h2 className="truncate text-lg font-black text-gray-900">
                        {product.name}
                      </h2>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {product.brand || 'Brand'}
                      </p>

                      <p className="mt-1 text-xs font-bold text-gray-400">
                        {product.id}
                      </p>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-xl font-black text-red-600 transition active:scale-95"
                    aria-label={`Rimuovi ${product.name}`}
                  >
                    ×
                  </button>
                </article>
              ))}
            </section>

            <section className="mt-8">
              <button
                type="button"
                onClick={clearList}
                className="w-full rounded-2xl bg-red-50 p-4 font-black text-red-700"
              >
                🗑️ Svuota lista
              </button>
            </section>
          </>
        )}

        <TelegramButton />
      </main>
    </>
  );
}