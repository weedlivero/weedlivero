import Link from 'next/link';

export default function CategoryCard({ category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
    >
      <div
        className={`relative h-40 bg-gradient-to-br ${category.gradient} p-6 flex items-end`}
      >
        <div className="absolute top-5 right-5 text-5xl opacity-90 transition-transform duration-200 group-hover:scale-110">
          {category.emoji}
        </div>

        <div>
          <h2 className="text-3xl font-black text-white">
            {category.title}
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-between p-5">
        <p className="text-sm text-gray-500">
          {category.description}
        </p>

        <span className="text-2xl text-green-600 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}