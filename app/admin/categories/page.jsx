'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import AdminGuard from '@/components/AdminGuard';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingSlug, setUpdatingSlug] = useState('');

  async function loadCategories() {
    try {
      setLoading(true);

      const response = await fetch('/api/categories', {
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Errore caricamento categorie');
        return;
      }

      setCategories(result.categories || []);
    } catch (error) {
      alert(error.message || 'Errore caricamento categorie');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function toggleCategory(category) {
    const nextActive = !category.active;

    try {
      setUpdatingSlug(category.slug);

      const response = await fetch(`/api/categories/${category.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: nextActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Errore aggiornamento categoria');
        return;
      }

      setCategories((current) =>
        current.map((item) =>
          item.slug === category.slug ? result.category : item
        )
      );
    } catch (error) {
      alert(error.message || 'Errore aggiornamento categoria');
    } finally {
      setUpdatingSlug('');
    }
  }

  return (
    <AdminGuard>
      <Header title="Categorie" />

      <main className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="text-sm font-bold text-gray-500">
          ← Torna alla dashboard
        </Link>

        <div className="mt-6">
          <h1 className="text-4xl font-black text-gray-900">
            Categorie
          </h1>

          <p className="mt-2 text-gray-500">
            Attiva o disattiva le categorie visibili nel catalogo.
          </p>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl bg-white p-6 text-center shadow-sm">
            Caricamento categorie...
          </div>
        ) : (
          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            {categories.map((category) => {
              const updating = updatingSlug === category.slug;

              return (
                <div
                  key={category.slug}
                  className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div
                    className={`rounded-2xl bg-gradient-to-br ${category.gradient} p-5 text-white`}
                  >
                    <div className="text-4xl">{category.emoji}</div>

                    <h2 className="mt-3 text-2xl font-black">
                      {category.title}
                    </h2>
                  </div>

                  <p className="mt-4 text-sm text-gray-500">
                    {category.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                    <span className="font-bold text-gray-800">
                      Stato
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        category.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {category.active ? 'ATTIVA' : 'DISATTIVA'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => toggleCategory(category)}
                    className={`mt-4 w-full rounded-2xl p-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                      category.active ? 'bg-red-500' : 'bg-green-600'
                    }`}
                  >
                    {updating
                      ? 'Aggiornamento...'
                      : category.active
                        ? 'Disattiva categoria'
                        : 'Attiva categoria'}
                  </button>
                </div>
              );
            })}

            {categories.length === 0 ? (
              <div className="rounded-3xl bg-white p-6 text-center text-gray-500 shadow-sm sm:col-span-2">
                Nessuna categoria trovata.
              </div>
            ) : null}
          </section>
        )}
      </main>
    </AdminGuard>
  );
}