'use client';

export default function AdminMenuActions() {
  function downloadMenu() {
    window.location.href = '/api/menu';
  }

  async function copyMenuLink() {
    const menuUrl = `${window.location.origin}/menu`;

    try {
      await navigator.clipboard.writeText(menuUrl);
      alert('Link del menu copiato.');
    } catch {
      alert(`Copia questo link: ${menuUrl}`);
    }
  }

  async function shareMenu() {
    const menuUrl = `${window.location.origin}/menu`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Menu Weedlivero',
          text: 'Consulta e scarica il menu aggiornato Weedlivero.',
          url: menuUrl,
        });

        return;
      }

      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(
          menuUrl
        )}&text=${encodeURIComponent(
          'Consulta il menu aggiornato Weedlivero'
        )}`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      console.error('Errore condivisione menu:', error);
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-md">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
          Menu utenti
        </p>

        <h2 className="mt-1 text-2xl font-black text-gray-900">
          Menu PDF aggiornato
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Il documento viene generato al momento utilizzando soltanto
          i prodotti attivi.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={downloadMenu}
          className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition active:scale-[0.98]"
        >
          📄 Genera e scarica
        </button>

        <a
          href="/menu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center font-black text-emerald-700 transition active:scale-[0.98]"
        >
          👁️ Anteprima pagina
        </a>

        <button
          type="button"
          onClick={copyMenuLink}
          className="rounded-2xl border border-gray-200 bg-white px-5 py-4 font-black text-gray-700 transition active:scale-[0.98]"
        >
          🔗 Copia link utenti
        </button>

        <button
          type="button"
          onClick={shareMenu}
          className="rounded-2xl bg-sky-600 px-5 py-4 font-black text-white transition active:scale-[0.98]"
        >
          ✈️ Condividi
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <p className="text-xs font-bold uppercase text-gray-400">
          Link pubblico
        </p>

        <p className="mt-1 break-all text-sm font-semibold text-gray-700">
          /menu
        </p>
      </div>
    </section>
  );
}