import Link from 'next/link';

function CategoryIcon({ category }) {
  const base = "h-16 w-16 text-green-600";

  if (category === 'vapes') {
    return (
      <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
        <rect x="14" y="30" width="36" height="14" rx="7" />
        <path d="M46 30c6-10-4-12 2-20" />
        <path d="M32 30c4-7-3-9 1-15" />
      </svg>
    );
  }

  if (category === 'hash') {
    return (
      <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
        <rect x="14" y="18" width="36" height="30" rx="6" />
        <path d="M22 26h20M22 34h14M22 42h18" />
      </svg>
    );
  }

  if (category === 'concentrate') {
    return (
      <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
        <path d="M32 8C22 22 16 31 16 42a16 16 0 0 0 32 0C48 31 42 22 32 8Z" />
        <path d="M36 44a6 6 0 0 1-8 4" />
      </svg>
    );
  }

  if (category === 'edibles') {
    return (
      <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
        <circle cx="32" cy="32" r="20" />
        <circle cx="24" cy="26" r="2" fill="currentColor" />
        <circle cx="38" cy="24" r="2" fill="currentColor" />
        <circle cx="35" cy="39" r="2" fill="currentColor" />
        <circle cx="25" cy="40" r="2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="4">
      <path d="M32 52C20 38 18 22 32 10c14 12 12 28 0 42Z" />
      <path d="M32 52V18" />
      <path d="M32 34c-8-2-12-8-14-14" />
      <path d="M32 38c8-2 12-8 14-14" />
    </svg>
  );
}

export default function ProductCard({ product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
    >
      <div className="flex h-44 items-center justify-center bg-gradient-to-br from-gray-100 to-green-50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <CategoryIcon category={product.category} />
        )}
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-green-600">
            {product.brand || 'Brand'}
          </p>

          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
            {product.id}
          </span>
        </div>

        <h3 className="text-xl font-black text-gray-900">
          {product.name}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-gray-500">
          {product.description}
        </p>
      </div>
    </Link>
  );
}