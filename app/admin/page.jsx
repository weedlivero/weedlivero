import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import AdminProductsList from '@/components/AdminProductsList';
import { getAdminProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const products = await getAdminProducts();

  const activeProducts = products.filter((product) => product.active);
  const inactiveProducts = products.filter((product) => !product.active);

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

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-md">
          <p className="text-sm font-bold text-gray-400">Totale prodotti</p>
          <p className="mt-2 text-3xl font-black">{products.length}</p>
        </div>

        <div className="rounded-3xl bg-green-50 p-6 shadow-md">
          <p className="text-sm font-bold text-green-600">Attivi</p>
          <p className="mt-2 text-3xl font-black text-green-700">
            {activeProducts.length}
          </p>
        </div>

        <div className="rounded-3xl bg-red-50 p-6 shadow-md">
          <p className="text-sm font-bold text-red-600">Non attivi</p>
          <p className="mt-2 text-3xl font-black text-red-700">
            {inactiveProducts.length}
          </p>
        </div>
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