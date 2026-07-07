import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import CategoryCard from '@/components/CategoryCard';
import { categories } from '@/data/categories';

export default function HomePage() {
  return (
    <AccessGate>
      <main className="min-h-screen bg-gradient-to-b from-white to-green-50 px-5 py-6">
        <Header />

        <section className="mx-auto mt-8 max-w-md">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-green-600">
            Scegli una categoria
          </p>

          <div className="grid gap-4">
            {categories.filter((category) => category.active).map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </section>
      </main>
    </AccessGate>
  );
}