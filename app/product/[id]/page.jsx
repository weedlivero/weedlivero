import RequestListBar from '@/components/RequestListBar';
import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import TelegramButton from '@/components/TelegramButton';
import AddToRequestListButton from '@/components/AddToRequestListButton';
import ProductImageLightbox from '@/components/ProductImageLightbox';
import { getProduct } from '@/lib/products';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getCategoryFallback(category) {
  switch (category) {
    case 'weed':
      return '🌿';

    case 'hash':
      return '🟫';

    case 'concentrate':
      return '💧';

    case 'edibles':
      return '🍬';

    case 'vapes':
      return '💨';

    default:
      return '📦';
  }
}

function renderStars(level) {
  const value = Number(level || 0);

  if (!value) {
    return null;
  }

  const safeValue = Math.min(5, Math.max(1, value));

  return '★'.repeat(safeValue) + '☆'.repeat(5 - safeValue);
}

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
}

function hasPriceInformation(product) {
  return Boolean(
    product.quality_level ||
      product.price_unit ||
      product.price_1g ||
      product.price_3g ||
      product.price_5g ||
      product.price_10g ||
      product.price_20g ||
      product.price_50g ||
      product.price_100g ||
      product.price_promo
  );
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const prices = [
    {
      label: 'Prezzo unitario',
      value: product.price_unit,
    },
    {
      label: '1 g',
      value: product.price_1g,
    },
    {
      label: '3 g',
      value: product.price_3g,
    },
    {
      label: '5 g',
      value: product.price_5g,
    },
    {
      label: '10 g',
      value: product.price_10g,
    },
    {
      label: '20 g',
      value: product.price_20g,
    },
    {
      label: '50 g',
      value: product.price_50g,
    },
    {
      label: '100 g',
      value: product.price_100g,
    },
  ].filter((item) => formatPrice(item.value));

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
          <ProductImageLightbox
            imageUrl={product.image_url}
            productName={product.name}
            fallback={getCategoryFallback(product.category)}
          />

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

            {product.description ? (
              <section className="mt-5">
                <h2 className="text-sm font-black uppercase tracking-wide text-gray-400">
                  Descrizione
                </h2>

                <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-gray-600">
                  {product.description}
                </p>
              </section>
            ) : null}

            {product.notes ? (
              <section className="mt-6 rounded-2xl bg-gray-50 p-5">
                <h2 className="text-sm font-black uppercase tracking-wide text-green-600">
                  Informazioni aggiuntive
                </h2>

                <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-gray-700">
                  {product.notes}
                </p>
              </section>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3">
              {product.thc ? (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-400">
                    THC
                  </p>

                  <p className="mt-1 text-xl font-black text-gray-900">
                    {product.thc}
                  </p>
                </div>
              ) : null}

              {product.cbd ? (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-400">
                    CBD
                  </p>

                  <p className="mt-1 text-xl font-black text-gray-900">
                    {product.cbd}
                  </p>
                </div>
              ) : null}
            </div>

            {hasPriceInformation(product) ? (
              <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <h2 className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  Qualità e prezzi
                </h2>

                {product.quality_level ? (
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="font-bold text-gray-700">
                      Qualità
                    </span>

                    <span className="text-xl tracking-wide text-amber-500">
                      {renderStars(product.quality_level)}
                    </span>
                  </div>
                ) : null}

                {prices.length > 0 ? (
                  <div className="mt-4 divide-y divide-emerald-100 overflow-hidden rounded-2xl border border-emerald-100 bg-white">
                    {prices.map((price) => (
                      <div
                        key={price.label}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-gray-600">
                          {price.label}
                        </span>

                        <strong className="text-base text-gray-900">
                          {formatPrice(price.value)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                {product.price_promo ? (
                  <div className="mt-5 rounded-2xl bg-green-600 p-4 text-center text-white">
                    <p className="text-xs font-bold uppercase tracking-wide text-green-100">
                      Promo
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {product.price_promo}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {product.video_url ? (
              <div className="mt-6 overflow-hidden rounded-2xl bg-black">
                <video
                  src={product.video_url}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
        </article>

        <div className="mt-6">
          <AddToRequestListButton product={product} />
        </div>

        <div className="mt-4">
          <TelegramButton />
        </div>
      </main>

      <RequestListBar />
    </AccessGate>
  );
}