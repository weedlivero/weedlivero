import Link from 'next/link';
import UserPopup from '@/components/UserPopup';
import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import CategoryCard from '@/components/CategoryCard';
import ProductCard from '@/components/ProductCard';
import { getActiveCategories } from '@/lib/categories';
import { getProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const categories = await getActiveCategories();
  const products = await getProducts();

  const featuredProducts = products.filter(
    (product) => product.featured && product.active !== false
  );

  const featuredProduct = featuredProducts[0];

  return (
    <AccessGate>
      <UserPopup />

      <main className="min-h-screen pb-20">
        <Header title="Catalogo" />

        <section className="mx-auto w-full max-w-md px-5 pt-8">
          <div className="wl-card relative overflow-hidden rounded-[2rem] px-6 py-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-300/25 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-lime-200/30 blur-3xl" />

            <div className="relative">
              <span className="wl-badge inline-flex px-3 py-1.5 text-xs uppercase tracking-[0.16em]">
                Catalogo privato
              </span>

              <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-gray-900">
                Scopri la selezione
                <span className="block text-emerald-700">
                  Weedlivero
                </span>
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
                Esplora le categorie e scopri i prodotti disponibili
                nella selezione del momento.
              </p>

              <div className="mt-6 flex items-center gap-3 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Catalogo aggiornato
                </span>

                <span className="h-1 w-1 rounded-full bg-gray-300" />

                <span>
                  {categories.length}{' '}
                  {categories.length === 1
                    ? 'categoria'
                    : 'categorie'}
                </span>
              </div>

              <Link
                href="/menu"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-200/70 transition active:scale-[0.98]"
              >
                <span aria-hidden="true">📄</span>
                Scarica menu aggiornato
              </Link>

              <p className="mt-2 text-center text-xs text-gray-400">
                Generato in tempo reale dai prodotti attivi.
              </p>
            </div>
          </div>

          {featuredProduct ? (
            <section className="mt-9">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                    Selezione speciale
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
                    In evidenza
                  </h2>
                </div>

                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  ★ Featured
                </span>
              </div>

              <div className="rounded-[2rem] border border-amber-200/70 bg-white/70 p-2 shadow-[0_18px_45px_rgba(146,64,14,0.08)] backdrop-blur-xl">
                <ProductCard product={featuredProduct} />
              </div>
            </section>
          ) : null}

          <section className="mt-10">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                Esplora
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
                Scegli una categoria
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Seleziona la categoria che vuoi consultare.
              </p>
            </div>

            {categories.length > 0 ? (
              <div className="grid gap-4">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.slug}
                    category={category}
                  />
                ))}
              </div>
            ) : (
              <div className="wl-card rounded-[2rem] px-6 py-10 text-center">
                <p className="font-bold text-gray-700">
                  Nessuna categoria disponibile.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Le categorie appariranno qui appena saranno attivate
                  dall’amministrazione.
                </p>
              </div>
            )}
          </section>

          <footer className="mt-12 border-t border-emerald-100/80 pt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Weedlivero
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Catalogo riservato · Accesso privato
            </p>
          </footer>
        </section>
      </main>
    </AccessGate>
  );
}