'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const filters = [
  {
    id: 'all',
    label: 'Tutti',
  },
  {
    id: 'featured',
    label: '⭐ Evidenza',
  },
  {
    id: 'active',
    label: '🟢 Attivi',
  },
  {
    id: 'inactive',
    label: '🔴 Disattivati',
  },
  {
    id: 'weed',
    label: '🌿 Weed',
  },
  {
    id: 'hash',
    label: '🟫 Hash',
  },
  {
    id: 'concentrate',
    label: '💧 Concentrate',
  },
  {
    id: 'edibles',
    label: '🍬 Edibles',
  },
  {
    id: 'vapes',
    label: '💨 Vapes',
  },
];

function getCategoryInfo(category) {
  switch (category) {
    case 'weed':
      return {
        label: 'WEED',
        emoji: '🌿',
        badgeClass: 'bg-green-100 text-green-700',
      };

    case 'hash':
      return {
        label: 'HASH',
        emoji: '🟫',
        badgeClass: 'bg-amber-100 text-amber-700',
      };

    case 'concentrate':
      return {
        label: 'CONCENTRATE',
        emoji: '💧',
        badgeClass: 'bg-cyan-100 text-cyan-700',
      };

    case 'edibles':
      return {
        label: 'EDIBLES',
        emoji: '🍬',
        badgeClass: 'bg-pink-100 text-pink-700',
      };

    case 'vapes':
      return {
        label: 'VAPES',
        emoji: '💨',
        badgeClass: 'bg-blue-100 text-blue-700',
      };

    default:
      return {
        label: String(category || 'ALTRO').toUpperCase(),
        emoji: '📦',
        badgeClass: 'bg-gray-100 text-gray-700',
      };
  }
}

function CategoryIcon({ category }) {
  const base = 'h-10 w-10 text-green-600';

  if (category === 'vapes') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={base}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      >
        <rect x="14" y="30" width="36" height="14" rx="7" />
        <path d="M46 30c6-10-4-12 2-20" />
        <path d="M32 30c4-7-3-9 1-15" />
      </svg>
    );
  }

  if (category === 'hash') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={base}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      >
        <rect x="14" y="18" width="36" height="30" rx="6" />
        <path d="M22 26h20M22 34h14M22 42h18" />
      </svg>
    );
  }

  if (category === 'concentrate') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={base}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      >
        <path d="M32 8C22 22 16 31 16 42a16 16 0 0 0 32 0C48 31 42 22 32 8Z" />
      </svg>
    );
  }

  if (category === 'edibles') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={base}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      >
        <circle cx="32" cy="32" r="20" />
        <circle cx="24" cy="26" r="2" fill="currentColor" />
        <circle cx="38" cy="24" r="2" fill="currentColor" />
        <circle cx="35" cy="39" r="2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={base}
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
    >
      <path d="M32 52C20 38 18 22 32 10c14 12 12 28 0 42Z" />
      <path d="M32 52V18" />
      <path d="M32 34c-8-2-12-8-14-14" />
      <path d="M32 38c8-2 12-8 14-14" />
    </svg>
  );
}

function getProductPriority(product) {
  if (product.featured === true) {
    return 0;
  }

  if (product.active === true) {
    return 1;
  }

  return 2;
}

function matchesFilter(product, selectedFilter) {
  switch (selectedFilter) {
    case 'featured':
      return product.featured === true;

    case 'active':
      return product.active === true;

    case 'inactive':
      return product.active !== true;

    case 'weed':
    case 'hash':
    case 'concentrate':
    case 'edibles':
    case 'vapes':
      return product.category === selectedFilter;

    default:
      return true;
  }
}

export default function AdminProductsList({ products = [] }) {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const normalizedQuery = query.toLowerCase().trim();

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((product) =>
        matchesFilter(product, selectedFilter)
      )
      .filter((product) => {
        if (!normalizedQuery) {
          return true;
        }

        const searchableText = [
          product.id,
          product.name,
          product.brand,
          product.category,
        ]
          .map((value) => String(value || '').toLowerCase())
          .join(' ');

        return searchableText.includes(normalizedQuery);
      })
      .sort((firstProduct, secondProduct) => {
        const priorityDifference =
          getProductPriority(firstProduct) -
          getProductPriority(secondProduct);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return String(firstProduct.name || '').localeCompare(
          String(secondProduct.name || ''),
          'it',
          {
            sensitivity: 'base',
          }
        );
      });
  }, [products, normalizedQuery, selectedFilter]);

  function clearFilters() {
    setQuery('');
    setSelectedFilter('all');
  }

  return (
    <>
      <div className="mt-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const selected = selectedFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedFilter(filter.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition active:scale-[0.98] ${
                  selected
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per codice, nome, brand o categoria..."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 outline-none transition focus:border-green-500 focus:bg-white"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-500">
            Risultati: {filteredProducts.length}
          </p>

          {normalizedQuery || selectedFilter !== 'all' ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-black text-green-600 transition hover:text-green-700"
            >
              Azzera filtri
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {filteredProducts.map((product) => {
          const categoryInfo = getCategoryInfo(product.category);

          return (
            <Link
              key={product.id}
              href={`/admin/products/${encodeURIComponent(
                product.id
              )}/edit`}
              className="block rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995]"
            >
              <div className="flex items-start gap-4">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name || 'Prodotto'}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
                      <CategoryIcon category={product.category} />

                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Nessuna foto
                      </span>
                    </div>
                  )}

                  {product.featured ? (
                    <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow-md">
                      ⭐
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-gray-900">
                        {product.name || 'Prodotto senza nome'}
                      </h3>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {product.brand || 'Brand non indicato'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${
                        product.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.active ? 'ATTIVO' : 'NON ATTIVO'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-black ${categoryInfo.badgeClass}`}
                    >
                      {categoryInfo.emoji} {categoryInfo.label}
                    </span>

                    {product.featured ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-700">
                        ⭐ IN EVIDENZA
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-xs font-bold text-gray-400">
                    Codice: {product.id}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🔍</div>

            <p className="mt-3 font-black text-gray-800">
              Nessun prodotto trovato
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Prova a cambiare filtro o termine di ricerca.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-2xl bg-gray-900 px-5 py-3 font-black text-white transition active:scale-[0.98]"
            >
              Mostra tutti i prodotti
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}