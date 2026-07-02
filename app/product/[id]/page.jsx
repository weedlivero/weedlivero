import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import { getProduct } from '@/lib/products';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <AccessGate>
      <Header title="Prodotto" />
      <main className="mx-auto max-w-3xl px-5 pb-28 pt-6">
        <Link href={`/category/${product.category}`} className="text-sm font-bold text-gray-500">← Torna alla categoria</Link>
        <article className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-soft">
          <div className="flex h-72 items-center justify-center bg-gradient-to-br from-gray-100 to-brand-soft text-7xl">🌿</div>
          <div className="p-7">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-green">{product.brand || 'Brand'}</p>
            <h1 className="mt-2 text-4xl font-black text-brand-dark">{product.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">{product.description}</p>
          </div>
        </article>
      </main>
    </AccessGate>
  );
}
