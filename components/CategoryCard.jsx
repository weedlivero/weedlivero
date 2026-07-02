import Link from 'next/link';

export default function CategoryCard({ category }) {
  return (
    <Link href={`/category/${category.slug}`} className="group block overflow-hidden rounded-[2rem] bg-white shadow-soft transition hover:-translate-y-1">
      <div className={`h-36 bg-gradient-to-br ${category.gradient} p-6`}>
        <div className="text-5xl transition group-hover:scale-110">{category.emoji}</div>
      </div>
      <div className="p-5">
        <h2 className="text-2xl font-black text-brand-dark">{category.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{category.description}</p>
      </div>
    </Link>
  );
}
