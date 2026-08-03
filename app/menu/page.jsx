import Link from 'next/link';
import MenuActions from '@/components/MenuActions';

export const metadata = {
  title: 'Menu Weedlivero',
  description: 'Scarica il menu aggiornato di Weedlivero',
};

export default function MenuPage() {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-xl">
        <div className="wl-card rounded-[2rem] p-8">
          <h1 className="text-center text-4xl font-black text-emerald-700">
            🌿 Weedlivero
          </h1>

          <p className="mt-4 text-center leading-6 text-gray-600">
            Scarica il menu aggiornato, generato in tempo reale dai
            prodotti attivi disponibili.
          </p>

          <a
            href="/api/menu"
            className="mt-8 flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-black text-white transition active:scale-[0.98]"
          >
            📄 Scarica menu PDF
          </a>

          <Link
            href="/"
            className="mt-4 flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-lg font-bold text-emerald-700 transition active:scale-[0.98]"
          >
            🌿 Apri catalogo
          </Link>

          <MenuActions />
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-gray-500">
          Il PDF viene creato al momento del download utilizzando
          esclusivamente i prodotti attivi.
        </p>
      </div>
    </main>
  );
}