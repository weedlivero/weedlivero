import Link from 'next/link';
import Header from '@/components/Header';
import AdminGuard from '@/components/AdminGuard';
import { getProducts } from '@/lib/products';

export default async function AdminPage() {
  const products = await getProducts();

  return (
    <AdminGuard>
      <Header title="Admin" />
      <main className="mx-auto max-w-5xl px-5 pb-28 pt-8">
        <section className="rounded-[2rem] bg-white p-7 shadow-soft">
          <h1 className="text-4xl font-black">Pannello Admin</h1>
          <p className="mt-2 text-gray-500">Gestione catalogo Weedlivero.</p>
          <Link href="/admin/products/new" className="mt-5 inline-flex rounded-2xl bg-brand-green px-5 py-3 font-bold text-white">+ Nuovo prodotto</Link>
        </section>
        <section className="mt-6 space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-soft">
              <div>
                <p className="font-black">{product.name}</p>
                <p className="text-sm text-gray-500">{product.brand} · {product.category}</p>
              </div>
              <Link href={`/admin/products/${product.id}/edit`} className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-bold">Modifica</Link>
            </div>
          ))}
        </section>
      </main>
    </AdminGuard>
  );
}
