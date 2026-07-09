'use client';

import { useState } from 'react';
import Link from 'next/link';

function CategoryIcon({ category }) {
  const base = 'h-10 w-10 text-green-600';

  if (category === 'vapes') {
    return (
      <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
        <rect x="14" y="30" width="36" height="14" rx="7" />
        <path d="M46 30c6-10-4-12 2-20" />
        <path d="M32 30c4-7-3-9 1-15" />
      </svg>
    );
  }

  if (category === 'hash') {
    return (
      <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
        <rect x="14" y="18" width="36" height="30" rx="6" />
        <path d="M22 26h20M22 34h14M22 42h18" />
      </svg>
    );
  }

  if (category === 'concentrate') {
    return (
      <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
        <path d="M32 8C22 22 16 31 16 42a16 16 0 0 0 32 0C48 31 42 22 32 8Z" />
      </svg>
    );
  }

  if (category === 'edibles') {
    return (
      <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
        <circle cx="32" cy="32" r="20" />
        <circle cx="24" cy="26" r="2" fill="currentColor" />
        <circle cx="38" cy="24" r="2" fill="currentColor" />
        <circle cx="35" cy="39" r="2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
      <path d="M32 52C20 38 18 22 32 10c14 12 12 28 0 42Z" />
      <path d="M32 52V18" />
      <path d="M32 34c-8-2-12-8-14-14" />
      <path d="M32 38c8-2 12-8 14-14" />
    </svg>
  );
}

export default function AdminProductsList({ products }) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.toLowerCase().trim();

  const filteredProducts = normalizedQuery
    ? products.filter((product) => {
        const text = `${product.id} ${product.name} ${product.brand} ${product.category}`.toLowerCase();
        return text.includes(normalizedQuery);
      })
    : products;

  return (
    <>
      <div className="mt-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per codice, nome, brand o categoria..."
          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 outline-none focus:border-green-500"
        />
      </div>

      {query ? (
        <p className="mt-3 text-sm font-bold text-gray-500">
          Risultati: {filteredProducts.length}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {filteredProducts.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}/edit`}
            className="block rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CategoryIcon category={product.category} />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {product.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {product.brand} • {product.category}
                  </p>

                  <p className="mt-1 text-xs font-bold text-gray-400">
                    {product.id}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  product.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {product.active ? 'ATTIVO' : 'NON ATTIVO'}
              </span>
            </div>
          </Link>
        ))}

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-center text-gray-500 shadow-sm">
            Nessun prodotto trovato.
          </div>
        ) : null}
      </div>
    </>
  );
}