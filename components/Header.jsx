import Image from 'next/image';
import Link from 'next/link';

export default function Header({ title = 'Weedlivero' }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">

        <Link
          href="/"
          className="transition hover:opacity-90"
        >
          <Image
            src="/logo-weedlivero.png"
            alt="Weedlivero"
            width={260}
            height={80}
            priority
            className="h-auto w-44 sm:w-56"
          />
        </Link>

        <span className="rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand-green shadow-sm">
          {title}
        </span>

      </div>
    </header>
  );
}
