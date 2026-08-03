'use client';

export default function MenuActions() {
  async function copyLink() {
    const menuUrl = `${window.location.origin}/menu`;

    try {
      await navigator.clipboard.writeText(menuUrl);
      alert('Link copiato negli appunti.');
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
          text: 'Scarica il menu aggiornato Weedlivero.',
          url: menuUrl,
        });

        return;
      }

      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(
          menuUrl
        )}&text=${encodeURIComponent(
          'Scarica il menu aggiornato Weedlivero'
        )}`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      console.error('Errore condivisione menu:', error);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copyLink}
        className="mt-4 w-full rounded-2xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-700 transition active:scale-[0.98]"
      >
        🔗 Copia link
      </button>

      <button
        type="button"
        onClick={shareMenu}
        className="mt-4 w-full rounded-2xl bg-green-700 px-6 py-4 font-bold text-white transition active:scale-[0.98]"
      >
        📲 Condividi
      </button>
    </>
  );
}