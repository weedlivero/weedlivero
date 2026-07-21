'use client';

import { useEffect, useState } from 'react';

export default function ProductImageLightbox({
  imageUrl,
  productName,
  fallback = '🌿',
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function closeWithEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeWithEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeWithEscape);
    };
  }, [open]);

  if (!imageUrl) {
    return (
      <div className="flex h-80 items-center justify-center bg-gradient-to-br from-gray-100 to-green-50 text-7xl">
        <span>{fallback}</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block h-80 w-full cursor-zoom-in overflow-hidden bg-gradient-to-br from-gray-100 to-green-50"
        aria-label={`Apri a schermo intero l'immagine di ${productName}`}
      >
        <img
          src={imageUrl}
          alt={productName}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />

        <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white backdrop-blur">
          Tocca per ingrandire
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Immagine di ${productName}`}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed right-4 top-4 z-[110] flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-3xl font-light text-white backdrop-blur transition hover:bg-white/25"
            aria-label="Chiudi immagine"
          >
            ×
          </button>

          <div
            className="max-h-full max-w-full overflow-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={productName}
              className="max-h-[92vh] max-w-[95vw] object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}