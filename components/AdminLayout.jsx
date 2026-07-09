import Link from 'next/link';
import Header from '@/components/Header';
import AdminGuard from '@/components/AdminGuard';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Prodotti', icon: '📦' },
  { href: '/admin/categories', label: 'Categorie', icon: '📂' },
];

export default function AdminLayout({ title, children }) {
  return (
    <AdminGuard>
      <Header title={title || 'Admin'} />

      <main className="mx-auto grid max-w-7xl gap-6 px-5 pb-24 pt-6 lg:grid-cols-[260px_1fr] lg:pb-10">
        <aside className="hidden rounded-3xl bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:block lg:h-fit">
          <p className="mb-4 px-3 text-xs font-black uppercase tracking-wide text-gray-400">
            Weedlivero Admin
          </p>

          <nav className="grid gap-2">
            {adminLinks.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-green-50 hover:text-green-700"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <section>{children}</section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 px-3 py-2 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
          {adminLinks.map((item) => (
            <Link
              key={`${item.href}-${item.label}-mobile`}
              href={item.href}
              className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-bold text-gray-600 active:bg-green-50 active:text-green-700"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-1 truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </AdminGuard>
  );
}