'use client';

import { useEffect, useState } from 'react';

function getCategoryEmoji(category) {
  switch (category) {
    case 'weed':
      return '🌿';

    case 'hash':
      return '🟫';

    case 'concentrate':
      return '💧';

    case 'edibles':
      return '🍬';

    case 'vapes':
      return '💨';

    default:
      return '📦';
  }
}

function cleanTelegramUsername(username) {
  return String(username || '')
    .trim()
    .replace(/^@+/, '');
}

function cleanPhoneNumber(phone) {
  return String(phone || '')
    .trim()
    .replace(/[^\d+]/g, '');
}

function getRequestPrefix(catalogName) {
  const words = String(catalogName || 'Weedlivero')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'WLV';
  }

  return words
    .map((word) => word[0])
    .join('')
    .slice(0, 4)
    .toUpperCase() || 'WLV';
}

function createRequestId(catalogName) {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');

  const datePart =
    `${String(now.getFullYear()).slice(2)}` +
    `${pad(now.getMonth() + 1)}` +
    `${pad(now.getDate())}`;

  const timePart =
    `${pad(now.getHours())}` +
    `${pad(now.getMinutes())}` +
    `${pad(now.getSeconds())}`;

  return `${getRequestPrefix(catalogName)}-${datePart}-${timePart}`;
}

function buildMessage(products, catalogName, catalogUrl) {
  const cleanCatalogUrl = String(catalogUrl || '')
    .trim()
    .replace(/\/+$/, '');

  const requestId = createRequestId(catalogName);

  const productLines = products.map((product) => {
    const emoji = getCategoryEmoji(product.category);

    const lines = [
      `${emoji} ${product.name}`,
      `Codice: ${product.id}`,
    ];

    if (cleanCatalogUrl) {
      lines.push('');
      lines.push('🔗 Scheda prodotto');
      lines.push(
        `${cleanCatalogUrl}/product/${encodeURIComponent(product.id)}`
      );
    }

    return lines.join('\n');
  });

  return [
    `🌿 ${catalogName || 'Weedlivero'}`,
    '',
    `Richiesta: ${requestId}`,
    '',
    'Ciao 👋',
    '',
    products.length === 1
      ? 'Vorrei informazioni sul seguente prodotto:'
      : 'Vorrei informazioni sui seguenti prodotti:',
    '',
    `Totale prodotti: ${products.length}`,
    '',
    '────────────────────────',
    '',
    productLines.join('\n\n────────────────────────\n\n'),
    '',
    'Grazie!',
  ].join('\n');
}

export default function RequestContactButtons({ products }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignalToast, setShowSignalToast] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);

        const response = await fetch(`/api/settings?t=${Date.now()}`, {
          cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || 'Errore caricamento impostazioni'
          );
        }

        setSettings(result.settings);
      } catch (error) {
        console.error('Errore caricamento impostazioni:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  if (loading || !settings || !products?.length) {
    return null;
  }

  const message = buildMessage(
    products,
    settings.catalog_name,
    settings.catalog_url
  );

  const telegramUsername = cleanTelegramUsername(
    settings.telegram_username
  );

  const signalPhone = cleanPhoneNumber(
    settings.signal_phone
  );

  const telegramAvailable =
    settings.telegram_enabled === true &&
    telegramUsername.length > 0;

  const signalAvailable =
    settings.signal_enabled === true &&
    Boolean(settings.signal_url?.trim() || signalPhone);

  function openTelegram() {
    if (!telegramAvailable) {
      return;
    }

    const telegramUrl =
      `https://t.me/${encodeURIComponent(telegramUsername)}` +
      `?text=${encodeURIComponent(message)}`;

    window.open(
      telegramUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }

   async function openSignal() {
  if (!signalAvailable) {
    return;
  }

  try {
    await navigator.clipboard.writeText(message);

    setShowSignalToast(true);

    window.setTimeout(() => {
      setShowSignalToast(false);
    }, 3000);
  } catch (error) {
    console.error('Errore copia messaggio:', error);

    alert(
      'Non è stato possibile copiare automaticamente il messaggio.'
    );
  }

  const customSignalUrl = settings.signal_url?.trim();

const isMobile =
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const signalUrl = customSignalUrl
  ? customSignalUrl
  : isMobile
    ? `https://signal.me/#p/${encodeURIComponent(signalPhone)}`
    : `sgnl://signal.me/#p/${encodeURIComponent(signalPhone)}`;

if (isMobile || customSignalUrl) {
  window.open(
    signalUrl,
    '_blank',
    'noopener,noreferrer'
  );
} else {
  window.location.href = signalUrl;
}
}

  if (!telegramAvailable && !signalAvailable) {
    return (
      <div className="mt-8 rounded-2xl bg-gray-100 p-4 text-center text-sm font-bold text-gray-500">
        Nessun canale di contatto disponibile.
      </div>
    );
  }

  return (
    <section className="mt-8 space-y-3">
      {telegramAvailable ? (
        <button
          type="button"
          onClick={openTelegram}
          className="w-full rounded-2xl bg-sky-500 p-4 font-black text-white transition active:scale-[0.98]"
        >
          ✈️ Invia con Telegram
        </button>
      ) : null}

      {signalAvailable ? (
  <>
    <button
      type="button"
      onClick={openSignal}
      className="w-full rounded-2xl bg-blue-600 p-4 font-black text-white transition active:scale-[0.98]"
    >
      🔵 Invia con Signal
    </button>

    {showSignalToast ? (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center text-sm font-bold text-blue-700">
        ✅ Messaggio copiato negli appunti.
        <br />
        Apri Signal e premi <strong>Incolla</strong>.
      </div>
    ) : null}
  </>
) : null}
    </section>
  );
}