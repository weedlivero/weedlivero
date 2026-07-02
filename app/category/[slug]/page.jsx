import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { categories } from '@/data/categories';
import { getProducts } from '@/lib/products';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CategoryPage({ params }) {
  const category = categories.find((item) => item.slug === params.slug);
  if (!category) notFound();
  const products = await getProducts(category.slug);

  return (
    <AccessGate>
      <Header title={category.title} />
      <main className="mx-auto max-w-5xl px-5 pb-28 pt-6">
        <Link href="/" className="text-sm font-bold text-gray-500">← Torna alle categorie</Link>
        <section className={`mt-5 rounded-[2rem] bg-gradient-to-br ${category.gradient} p-8 text-white shadow-soft`}>
          <div className="text-5xl">{category.emoji}</div>
          <h1 className="mt-3 text-4xl font-black">{category.title}</h1>
          <p className="mt-2 font-semibold opacity-90">{products.length} prodotti</p>
        </section>
        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
        {products.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white p-6 text-center shadow-soft">Nessun prodotto presente in questa categoria.</div>
        ) : null}
      </main>
    </AccessGate>
  );
}
