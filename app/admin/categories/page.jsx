import Link from 'next/link';
import Header from '@/components/Header';
import AdminGuard from '@/components/AdminGuard';
import { categories } from '@/data/categories';

export default function AdminCategoriesPage() {
  const activeCategories = categories.filter((category) => category.active);

  return (
    <AdminGuard>
      <Header title="Categorie" />

      <main className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="text-sm font-bold text-gray-500">
          ← Torna alla dashboard
        </Link>

        <section className="mt-6">
          <h1 className="text-4xl font-black text-gray-900">
            Categorie
          </h1>

          <p className="mt-2 text-gray-500">
            Gestisci le categorie visibili nella home del catalogo.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-400">Totali</p>
              <p className="mt-1 text-3xl font-black">{categories.length}</p>
            </div>

            <div className="rounded-3xl bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-bold text-green-600">Attive</p>
              <p className="mt-1 text-3xl font-black text-green-700">
                {activeCategories.length}
              </p>
            </div>

            <div className="rounded-3xl bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-bold text-red-600">Nascoste</p>
              <p className="mt-1 text-3xl font-black text-red-700">
                {categories.length - activeCategories.length}
              </p>
            </div>
          </div>
        </section>

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
                  {category.active ? 'ATTIVA' : 'NASCOSTA'}
                </span>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Ordine: {category.order}
              </p>
            </div>
          ))}
        </section>
      </main>
    </AdminGuard>
  );
}