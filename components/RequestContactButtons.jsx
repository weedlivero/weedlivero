'use client';



import { useEffect, useRef, useState } from 'react';



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



// Converte esclusivamente la risposta verificata dall'API nel formato del messaggio esistente.
const VERIFIED_PRICE_FIELDS = Object.freeze({
  unit: 'price_unit', '1g': 'price_1g', '3g': 'price_3g',
  '5g': 'price_5g', '10g': 'price_10g', '20g': 'price_20g',
  '50g': 'price_50g', '100g': 'price_100g',
});

function verifiedMessageProducts(payload) {
  if (payload?.success !== true || payload.currency !== 'EUR' ||
      !Array.isArray(payload.products) || payload.products.length === 0 ||
      !Number.isFinite(payload.total) || payload.total <= 0) {
    throw new Error('Risposta di verifica ordine non valida.');
  }
  let computedTotal = 0;
  const result = payload.products.map((product) => {
    if (!product || typeof product.id !== 'string' || typeof product.name !== 'string' ||
        !Array.isArray(product.selections) || !product.selections.length) {
      throw new Error('Prodotto verificato non valido.');
    }
    const selections = {};
    const prices = {};
    let subtotal = 0;
    for (const entry of product.selections) {
      const field = VERIFIED_PRICE_FIELDS[entry?.size];
      if (!field || Object.prototype.hasOwnProperty.call(selections, entry.size) ||
          !Number.isSafeInteger(entry.quantity) || entry.quantity < 1 ||
          !Number.isFinite(entry.unitPrice) || entry.unitPrice <= 0 ||
          !Number.isFinite(entry.subtotal) ||
          Math.abs(entry.subtotal - entry.unitPrice * entry.quantity) > 0.001) {
        throw new Error('Quantità o prezzo verificato non valido.');
      }
      selections[entry.size] = entry.quantity;
      prices[field] = entry.unitPrice;
      subtotal += entry.subtotal;
    }
    if (!Number.isFinite(product.subtotal) || Math.abs(subtotal - product.subtotal) > 0.001) {
      throw new Error('Subtotale verificato non valido.');
    }
    computedTotal += subtotal;
    return { id: product.id, name: product.name, category: product.category,
      ...prices, selections };
  });
  if (Math.abs(computedTotal - payload.total) > 0.001) {
    throw new Error('Totale verificato non valido.');
  }
  return result;
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



  const orderInFlight = useRef(false);
  const [verifyingOrder, setVerifyingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [manualSignalMessage, setManualSignalMessage] = useState('');

  useEffect(() => {

    async function loadSettings() {

      try {

        setLoading(true);



        const response = await fetch(

          `/api/public-settings?t=${Date.now()}`,

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



  async function prepareVerifiedMessage() {
    const requestProducts = (products || []).map((product) => ({
      id: product.id,
      selections: Object.fromEntries(
        Object.entries(product.selections || {}).filter(([, quantity]) => Number(quantity) > 0)
      ),
    })).filter((product) => Object.keys(product.selections).length > 0);

    const response = await fetch('/api/customer/prepare-order', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: requestProducts }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Per ordinare devi accedere con un account approvato.');
      }
      throw new Error(payload.error || 'Verifica ordine non riuscita.');
    }
    const checkedProducts = verifiedMessageProducts(payload);
    return buildMessage(checkedProducts, settings.catalog_name, settings.catalog_url);
  }

  async function runVerifiedOrder(action) {
    if (orderInFlight.current) return;
    orderInFlight.current = true;
    setVerifyingOrder(true);
    setOrderError('');
    setManualSignalMessage('');
    try {
      const checkedMessage = await prepareVerifiedMessage();
      await action(checkedMessage);
    } catch (error) {
      setOrderError(error?.message || 'Impossibile preparare l’ordine.');
    } finally {
      orderInFlight.current = false;
      setVerifyingOrder(false);
    }
  }

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
    if (!telegramAvailable || orderInFlight.current) return;
    void runVerifiedOrder(async (checkedMessage) => {
      const telegramUrl = `https://t.me/${encodeURIComponent(telegramUsername)}` +
        `?text=${encodeURIComponent(checkedMessage)}`;
      // Dopo una chiamata asincrona i popup possono essere bloccati: navigazione diretta.
      window.location.assign(telegramUrl);
    });
  }

  function openSignal() {
    if (!signalAvailable || orderInFlight.current) return;
    void runVerifiedOrder(async (checkedMessage) => {
      try {
        await navigator.clipboard.writeText(checkedMessage);
        setShowSignalToast(true);
        window.setTimeout(() => setShowSignalToast(false), 3000);
      } catch (error) {
        // Dopo la richiesta asincrona alcuni browser non consentono la clipboard.
        // Mostra il testo verificato, senza aprire Signal con un messaggio non copiato.
        setManualSignalMessage(checkedMessage);
        throw new Error('Copia automatica non disponibile. Copia il messaggio verificato qui sotto.');
      }
      const customSignalUrl = settings.signal_url?.trim();
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const signalUrl = customSignalUrl
        ? customSignalUrl
        : isMobile
          ? `https://signal.me/#p/${encodeURIComponent(signalPhone)}`
          : `sgnl://signal.me/#p/${encodeURIComponent(signalPhone)}`;
      if (isMobile || customSignalUrl) {
        window.open(signalUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = signalUrl;
      }
    });
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
      {verifyingOrder ? (
        <p role="status" className="text-center text-sm text-gray-600">Verifica ordine in corso...</p>
      ) : null}
      {orderError ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-sm font-bold text-red-700">{orderError}</p>
      ) : null}
      {manualSignalMessage ? (
        <textarea aria-label="Messaggio verificato da copiare" readOnly value={manualSignalMessage}
          rows={8} className="w-full rounded-xl border border-gray-300 p-3 text-sm" />
      ) : null}


      {telegramAvailable ? (

        <button

          type="button"

          onClick={openTelegram}
          disabled={verifyingOrder}

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
            disabled={verifyingOrder}

            className="w-full rounded-2xl bg-blue-600 p-4 font-black text-white transition active:scale-[0.98]"

          >

            🔒 Invia con Signal

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
