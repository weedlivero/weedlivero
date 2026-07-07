import Link from 'next/link';
import { notFound } from 'next/navigation';
import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import ProductGrid from '@/components/ProductGrid';
import { categories } from '@/data/categories';
import { getProducts } from '@/lib/products';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoryPage({ params }) {
  const category = categories.find((item) => item.slug === params.slug);

  if (!category || category.active === false) {
    notFound();
  }

  const products = await getProducts(category.slug);
  const featuredProducts = products.filter((product) => product.featured);

  return (
    <AccessGate>
      <Header title={category.title} />

      <main className="mx-auto max-w-5xl px-5 pb-28 pt-6">
        <Link href="/" className="text-sm font-bold text-gray-500">
          ← Torna alle categorie
        </Link>

        <section
          className={`mt-5 rounded-3xl bg-gradient-to-br ${category.gradient} p-8 text-white shadow-md`}
        >
          <div className="text-5xl">{category.emoji}</div>

          <h1 className="mt-3 text-4xl font-black">
            {category.title}
          </h1>

          <p className="mt-2 font-semibold opacity-90">
            {products.length} prodotti disponibili
          </p>
        </section>

        {featuredProducts.length > 0 ? (
          <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-green-600">
              In evidenza
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="rounded-2xl bg-green-50 p-4"
                >
                  <p className="text-sm font-bold text-green-700">
                    {product.id}
                  </p>

                  <h3 className="mt-1 text-lg font-black text-gray-900">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {product.brand}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <ProductGrid products={products} />
      </main>
    </AccessGate>
  );
}