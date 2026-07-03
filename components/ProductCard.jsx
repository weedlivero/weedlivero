import Link from 'next/link';

export default function ProductCard({ product }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
    >
      <div className="flex h-44 items-center justify-center bg-gradient-to-br from-gray-100 to-green-50 text-5xl">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>🌿</span>
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