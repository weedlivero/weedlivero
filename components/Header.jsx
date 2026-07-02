import Link from 'next/link';

export default function Header({ title = 'Weedlivero' }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-xl font-black tracking-tight text-brand-dark">
          Weed<span className="text-brand-green">livero</span>
        </Link>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-green">
          {title}
        </span>
      </div>
    </header>
  );
}
