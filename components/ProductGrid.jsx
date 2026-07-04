'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';

export default function ProductGrid({ products }) {
  const [query, setQuery] = useState('');

  const filteredProducts = products.filter((product) => {
    const text = `${product.name} ${product.brand} ${product.description}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <>
      <div className="mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca prodotto..."
          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-base outline-none focus:border-green-500"
        />
      </div>

      {filteredProducts.length > 0 ? (
        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : (
        <div className="mt-6 rounded-3xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Nessun prodotto trovato.
        </div>
      )}
    </>
  );
}