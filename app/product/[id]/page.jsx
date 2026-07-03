import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import TelegramButton from '@/components/TelegramButton';
import { getProduct } from '@/lib/products';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <AccessGate>
      <Header title="Prodotto" />

      <main className="mx-auto max-w-3xl px-5 pb-32 pt-6">
        <Link
          href={`/category/${product.category}`}
          className="text-sm font-bold text-gray-500"
        >
          ← Torna alla categoria
        </Link>

        <article className="mt-5 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md">
          <div className="flex h-80 items-center justify-center bg-gradient-to-br from-gray-100 to-green-50 text-7xl">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>🌿</span>
            )}
          </div>

          <div className="p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                {product.brand || 'Brand'}
              </p>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                {product.id}
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-gray-900">
              {product.name}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-gray-600">
              {product.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {product.thc ? (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-400">THC</p>
                  <p className="mt-1 text-xl font-black text-gray-900">{product.thc}</p>
                </div>
              ) : null}

              {product.cbd ? (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-400">CBD</p>
                  <p className="mt-1 text-xl font-black text-gray-900">{product.cbd}</p>
                </div>
              ) : null}
            </div>

            {product.video_url ? (
              <div className="mt-6 overflow-hidden rounded-2xl bg-black">
                <video
                  src={product.video_url}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
        </article>

        <TelegramButton />
      </main>
    </AccessGate>
  );
}