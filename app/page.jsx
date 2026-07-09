import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import CategoryCard from '@/components/CategoryCard';
import ProductCard from '@/components/ProductCard';
import { categories } from '@/data/categories';
import { getProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const products = await getProducts();
  const featuredProducts = products.filter((product) => product.featured);

  return (
    <AccessGate>
      <main className="min-h-screen bg-gradient-to-b from-white to-green-50 px-5 py-6">
        <Header />

        <section className="mx-auto mt-8 max-w-md">
          {featuredProducts.length > 0 ? (
            <div className="mb-8">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-green-600">
                In evidenza
              </p>

              <ProductCard product={featuredProducts[0]} />
            </div>
          ) : null}

          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-green-600">
            Scegli una categoria
          </p>

          <div className="grid gap-4">
            {categories
              .filter((category) => category.active)
              .sort((a, b) => a.order - b.order)
              .map((category) => (
                <CategoryCard key={category.slug} category={category} />
              ))}
          </div>
        </section>
      </main>
    </AccessGate>
  );
}