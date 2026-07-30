import Link from 'next/link';

export default function CategoryCard({ category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block overflow-hidden rounded-[2rem] border border-emerald-100/70 bg-white/75 shadow-[0_15px_45px_rgba(6,95,70,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(6,95,70,0.16)] active:scale-[0.98]"
    >
      <div
        className={`relative h-44 overflow-hidden bg-gradient-to-br ${category.gradient}`}
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        <div className="absolute right-6 top-5 text-6xl transition duration-300 group-hover:scale-110 group-hover:rotate-6">
          {category.emoji}
        </div>

        <div className="absolute bottom-6 left-6">
          <div className="mb-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
            Categoria
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white">
            {category.title}
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm leading-6 text-gray-600">
            {category.description}
          </p>

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Tocca per esplorare
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-700 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:translate-x-1">
          →
        </div>
      </div>
    </Link>
  );
}