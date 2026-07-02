import Link from 'next/link';

export default function ProductCard({ product }) {
  return (
    <Link href={`/product/${product.id}`} className="block overflow-hidden rounded-[1.75rem] bg-white shadow-soft transition hover:-translate-y-1">
      <div className="flex h-44 items-center justify-center bg-gradient-to-br from-gray-100 to-brand-soft text-5xl">🌿</div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-green">{product.brand || 'Brand'}</p>
        <h3 className="mt-1 text-xl font-black text-brand-dark">{product.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{product.description}</p>
      </div>
    </Link>
  );
}
