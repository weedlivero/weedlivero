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

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '0,00 €';
  }

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
}

function getRequestPrefix(catalogName) {
  const words = String(
    catalogName || 'Weedlivero'
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return (
      words[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'WLV'
    );
  }

  return (
    words
      .map((word) => word[0])
      .join('')
      .slice(0, 4)
      .toUpperCase() || 'WLV'
  );
}

function createRequestId(catalogName) {
  const now = new Date();

  const pad = (value) =>
    String(value).padStart(2, '0');

  const datePart =
    `${String(now.getFullYear()).slice(2)}` +
    `${pad(now.getMonth() + 1)}` +
    `${pad(now.getDate())}`;

  const timePart =
    `${pad(now.getHours())}` +
    `${pad(now.getMinutes())}` +
    `${pad(now.getSeconds())}`;

  return `${getRequestPrefix(
    catalogName
  )}-${datePart}-${timePart}`;
}

function getAvailableSizes(product) {
  return [
    {
      key: 'unit',
      label: 'Unità',
      price: product.price_unit,
    },
    {
      key: '1g',
      label: '1 g',
      price: product.price_1g,
    },
    {
      key: '3g',
      label: '3 g',
      price: product.price_3g,
    },
    {
      key: '5g',
      label: '5 g',
      price: product.price_5g,
    },
    {
      key: '10g',
      label: '10 g',
      price: product.price_10g,
    },
    {
      key: '20g',
      label: '20 g',
      price: product.price_20g,
    },
    {
      key: '50g',
      label: '50 g',
      price: product.price_50g,
    },
    {
      key: '100g',
      label: '100 g',
      price: product.price_100g,
    },
  ].filter((size) => {
    const price = Number(size.price);

    return Number.isFinite(price) && price > 0;
  });
}

function getProductSelections(product) {
  return getAvailableSizes(product)
    .map((size) => {
      const quantity =
        Number(
          product.selections?.[size.key]
        ) || 0;

      if (quantity <= 0) {
        return null;
      }

      const subtotal =
        Number(size.price) * quantity;

      return {
        ...size,
        quantity,
        subtotal,
      };
    })
    .filter(Boolean);
}

function getProductTotal(product) {
  return getProductSelections(product).reduce(
    (total, selection) =>
      total + selection.subtotal,
    0
  );
}

function getOrderTotal(products) {
  return products.reduce(
    (total, product) =>
      total + getProductTotal(product),
    0
  );
}


function buildMessage(
  products,
  catalogName,
  catalogUrl
) {
  const cleanCatalogUrl = String(
    catalogUrl || ''
  )
    .trim()
    .replace(/\/+$/, '');

  const requestId =
    createRequestId(catalogName);

  const selectedProducts =
    products.filter(
      (product) =>
        getProductSelections(product).length > 0
    );

  const productLines =
    selectedProducts.map((product) => {
      const emoji =
        getCategoryEmoji(product.category);

      const selections =
        getProductSelections(product);

      const productTotal =
        getProductTotal(product);

      const lines = [
        `${emoji} ${product.name}`,
        `Codice: ${product.id}`,
        '',
      ];

      selections.forEach((selection) => {
        lines.push(
          `${selection.label} × ${selection.quantity} = ${formatPrice(
            selection.subtotal
          )}`
        );
      });

      lines.push('');
      lines.push(
        `Subtotale: ${formatPrice(
          productTotal
        )}`
      );

      if (cleanCatalogUrl) {
        lines.push('');
        lines.push('🔗 Scheda prodotto');
        lines.push(
          `${cleanCatalogUrl}/product/${encodeURIComponent(
            product.id
          )}`
        );
      }

      return lines.join('\n');
    });

  const orderTotal =
    getOrderTotal(selectedProducts);

  

  return [
    `🌿 ${catalogName || 'Weedlivero'}`,
    '',
    `Richiesta: ${requestId}`,
    '',
    'Ciao 👋',
    '',
    selectedProducts.length === 1
      ? 'Vorrei ordinare il seguente prodotto:'
      : 'Vorrei ordinare i seguenti prodotti:',
    '',
    `Prodotti diversi: ${selectedProducts.length}`,
  
    '',
    '────────────────────────',
    '',
    productLines.join(
      '\n\n────────────────────────\n\n'
    ),
    '',
    '────────────────────────',
    '',
    `💰 TOTALE ORDINE: ${formatPrice(
      orderTotal
    )}`,
    '',
    'Grazie!',
  ].join('\n');
}

export default function RequestContactButtons({
  products,
}) {
  const [settings, setSettings] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    showSignalToast,
    setShowSignalToast,
  ] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/settings?t=${Date.now()}`,
          {
            cache: 'no-store',
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Errore caricamento impostazioni'
          );
        }

        setSettings(result.settings);
      } catch (error) {
        console.error(
          'Errore caricamento impostazioni:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  if (
    loading ||
    !settings ||
    !products?.length
  ) {
    return null;
  }

  const message = buildMessage(
    products,
    settings.catalog_name,
    settings.catalog_url
  );

  const telegramUsername =
    cleanTelegramUsername(
      settings.telegram_username
    );

  const signalPhone =
    cleanPhoneNumber(
      settings.signal_phone
    );

  const telegramAvailable =
    settings.telegram_enabled === true &&
    telegramUsername.length > 0;

  const signalAvailable =
    settings.signal_enabled === true &&
    Boolean(
      settings.signal_url?.trim() ||
        signalPhone
    );

  function openTelegram() {
    if (!telegramAvailable) {
      return;
    }

    const telegramUrl =
      `https://t.me/${encodeURIComponent(
        telegramUsername
      )}` +
      `?text=${encodeURIComponent(
        message
      )}`;

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
      await navigator.clipboard.writeText(
        message
      );

      setShowSignalToast(true);

      window.setTimeout(() => {
        setShowSignalToast(false);
      }, 3000);
    } catch (error) {
      console.error(
        'Errore copia messaggio:',
        error
      );

      alert(
        'Non è stato possibile copiare automaticamente il messaggio.'
      );
    }

    const customSignalUrl =
      settings.signal_url?.trim();

    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
      );

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

  if (
    !telegramAvailable &&
    !signalAvailable
  ) {
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
              Apri Signal e premi{' '}
              <strong>Incolla</strong>.
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}