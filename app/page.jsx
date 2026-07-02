import AccessGate from '@/components/AccessGate';
import Header from '@/components/Header';
import CategoryCard from '@/components/CategoryCard';
import { categories } from '@/data/categories';

export default function HomePage() {
  return (
    <AccessGate>
      <Header title="Catalogo" />
      <main className="mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-8">
        <section className="rounded-[2rem] bg-white p-7 shadow-soft">
          <p className="font-bold uppercase tracking-[0.3em] text-brand-green">Weedlivero</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-brand-dark">Scegli una categoria</h1>
          <p className="mt-3 text-gray-500">Interfaccia semplice: apri una sezione e consulta i prodotti disponibili.</p>
        </section>
        <section className="mt-6 grid gap-5 sm:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </section>
      </main>
    </AccessGate>
  );
}
