import Link from 'next/link';
import Header from '@/components/Header';
import AdminGuard from '@/components/AdminGuard';
import { getProducts } from '@/lib/products';

export default async function AdminPage() {
  const products = await getProducts();

  return (
    <AdminGuard>
      <Header title="Admin" />

      <main className="mx-auto max-w-6xl px-5 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Gestisci il catalogo Weedlivero
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Link
            href="/admin/products/new"
            className="rounded-3xl bg-green-600 p-6 text-white shadow-lg transition hover:scale-[1.02]"
          >
            <div className="text-4xl">📦</div>

            <h2 className="mt-4 text-xl font-black">
              Prodotti
            </h2>

            <p className="mt-1 text-sm opacity-90">
              Nuovo prodotto
            </p>
          </Link>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <div className="text-4xl">📂</div>

            <h2 className="mt-4 text-xl font-black">
              Categorie
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              5 categorie
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <div className="text-4xl">🏷️</div>

            <h2 className="mt-4 text-xl font-black">
              Brand
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gestione marchi
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <div className="text-4xl">⚙️</div>

            <h2 className="mt-4 text-xl font-black">
              Impostazioni
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Telegram e configurazione
            </p>
          </div>

        </section>

        <div className="mt-10">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-2xl font-black">
              Prodotti
            </h2>

            <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
              {products.length} prodotti
            </span>

          </div>

          <div className="space-y-3">

            {products.map((product) => (

              <div
                key={product.id}
                className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
              >

                <div>

                  <p className="font-black">
                    {product.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {product.brand} • {product.category}
                  </p>

                </div>

                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-bold transition hover:bg-gray-200"
                >
                  Modifica
                </Link>

              </div>

            ))}

          </div>

        </div>

      </main>

    </AdminGuard>
  );
}