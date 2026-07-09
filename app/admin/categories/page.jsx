import Link from 'next/link';
import Header from '@/components/Header';
import AdminGuard from '@/components/AdminGuard';
import { categories } from '@/data/categories';

export default function AdminCategoriesPage() {
  return (
    <AdminGuard>
      <Header title="Categorie" />

      <main className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="text-sm font-bold text-gray-500">
          ← Torna alla dashboard
        </Link>

        <div className="mt-6">
          <h1 className="text-4xl font-black text-gray-900">Categorie</h1>
          <p className="mt-2 text-gray-500">
            Visualizza le categorie del catalogo.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <div
              key={category.slug}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div
                className={`rounded-2xl bg-gradient-to-br ${category.gradient} p-5 text-white`}
              >
                <div className="text-4xl">{category.emoji}</div>
                <h2 className="mt-3 text-2xl font-black">{category.title}</h2>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                {category.description}
              </p>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <span className="font-bold text-gray-800">Stato</span>
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
            </div>
          ))}
        </section>
      </main>
    </AdminGuard>
  );
}