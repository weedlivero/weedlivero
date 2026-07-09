import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import AdminProductsList from '@/components/AdminProductsList';
import { getAdminProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <AdminLayout title="Prodotti">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900">
            Prodotti
          </h1>

          <p className="mt-2 text-gray-500">
            Gestisci tutti i prodotti del catalogo.
          </p>
        </div>

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