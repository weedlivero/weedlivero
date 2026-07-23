import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import AdminProductsList from '@/components/AdminProductsList';
import { getAdminProducts } from '@/lib/products';
import { getCategories } from '@/lib/categories';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getCategories(),
  ]);

  const activeProducts = products.filter(
    (product) => product.active === true
  );

  const inactiveProducts = products.filter(
    (product) => product.active !== true
  );

  const activeCategories = categories.filter(
    (category) => category.active === true
  );

  const inactiveCategories = categories.filter(
    (category) => category.active !== true
  );

  return (
    <AdminLayout title="Admin">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-500">
          Gestisci il catalogo Weedlivero
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-md">
          <p className="text-sm font-bold text-gray-400">
            Totale prodotti
          </p>

          <p className="mt-2 text-3xl font-black text-gray-900">
            {products.length}
          </p>
        </div>

        <div className="rounded-3xl bg-green-50 p-6 shadow-md">
          <p className="text-sm font-bold text-green-600">
            Prodotti attivi
          </p>

          <p className="mt-2 text-3xl font-black text-green-700">
            {activeProducts.length}
          </p>
        </div>

        <div className="rounded-3xl bg-red-50 p-6 shadow-md">
          <p className="text-sm font-bold text-red-600">
            Prodotti non attivi
          </p>

          <p className="mt-2 text-3xl font-black text-red-700">
            {inactiveProducts.length}
          </p>
        </div>

        <Link
          href="/admin/categories"
          className="rounded-3xl bg-white p-6 shadow-md transition hover:shadow-lg"
        >
          <p className="text-sm font-bold text-gray-400">
            Totale categorie
          </p>

          <p className="mt-2 text-3xl font-black text-gray-900">
            {categories.length}
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="rounded-3xl bg-emerald-50 p-6 shadow-md transition hover:shadow-lg"
        >
          <p className="text-sm font-bold text-emerald-600">
            Categorie attive
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-700">
            {activeCategories.length}
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="rounded-3xl bg-orange-50 p-6 shadow-md transition hover:shadow-lg"
        >
          <p className="text-sm font-bold text-orange-600">
            Categorie disattivate
          </p>

          <p className="mt-2 text-3xl font-black text-orange-700">
            {inactiveCategories.length}
          </p>
        </Link>
      </section>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-black text-gray-900">
          Prodotti
        </h2>

        <Link
          href="/admin/products/new"
          className="rounded-2xl bg-green-600 px-5 py-3 text-center font-bold text-white"
        >
          + Nuovo prodotto
        </Link>
      </div>

      <AdminProductsList products={products} />
    </AdminLayout>
  );
}