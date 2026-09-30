'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getRequestListProduct,
  setProductSelections,
} from '@/lib/requestList';

function toPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function formatPrice(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export default function AddToRequestListButton({
  product,
}) {
  const [selections, setSelections] = useState({});
  const [savedSelections, setSavedSelections] =
    useState({});
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');

  const sizes = useMemo(
    () =>
      [
        {
          key: 'unit',
          label: 'Unità',
          price: toPrice(product.price_unit),
        },
        {
          key: '1g',
          label: '1 g',
          price: toPrice(product.price_1g),
        },
        {
          key: '3g',
          label: '3 g',
          price: toPrice(product.price_3g),
        },
        {
          key: '5g',
          label: '5 g',
          price: toPrice(product.price_5g),
        },
        {
          key: '10g',
          label: '10 g',
          price: toPrice(product.price_10g),
        },
        {
          key: '20g',
          label: '20 g',
          price: toPrice(product.price_20g),
        },
        {
          key: '50g',
          label: '50 g',
          price: toPrice(product.price_50g),
        },
        {
          key: '100g',
          label: '100 g',
          price: toPrice(product.price_100g),
        },
      ].filter(
        (item) => item.price !== null
      ),
    [product]
  );

  useEffect(() => {
    const existing =
      getRequestListProduct(product.id);

    const existingSelections = {
      ...(existing?.selections || {}),
    };

    setSelections(existingSelections);
    setSavedSelections(existingSelections);
    setLoaded(true);
  }, [product.id]);

  const totalQuantity = Object.values(
    selections
  ).reduce(
    (total, quantity) =>
      total + (Number(quantity) || 0),
    0
  );

  const totalPrice = sizes.reduce(
    (total, size) => {
      const quantity =
        Number(selections[size.key]) || 0;

      return total + size.price * quantity;
    },
    0
  );

  const wasAlreadyInList =
    Object.keys(savedSelections).length > 0;

  function increase(size) {
    setMessage('');

    setSelections((current) => ({
      ...current,
      [size]:
        (Number(current[size]) || 0) + 1,
    }));
  }

  function decrease(size) {
    setMessage('');

    setSelections((current) => {
      const nextQuantity = Math.max(
        0,
        (Number(current[size]) || 0) - 1
      );

      const next = {
        ...current,
      };

      if (nextQuantity === 0) {
        delete next[size];
      } else {
        next[size] = nextQuantity;
      }

      return next;
    });
  }

  function saveSelections() {
    setProductSelections(
      product,
      selections
    );

    const cleanSelections = {};

    Object.entries(selections).forEach(
      ([size, quantity]) => {
        const numericQuantity =
          Math.max(
            0,
            Math.floor(
              Number(quantity) || 0
            )
          );

        if (numericQuantity > 0) {
          cleanSelections[size] =
            numericQuantity;
        }
      }
    );

    setSelections(cleanSelections);
    setSavedSelections(cleanSelections);

    if (
      Object.keys(cleanSelections).length ===
      0
    ) {
      setMessage(
        '✓ Prodotto rimosso dal carrello'
      );
    } else if (wasAlreadyInList) {
      setMessage(
        '✓ Quantità aggiornate nel carrello'
      );
    } else {
      setMessage(
        '✓ Prodotto aggiunto al carrello'
      );
    }
  }

  if (!loaded || sizes.length === 0) {
    return null;
  }

  return (
  <div className="mt-4">
    <div className="divide-y divide-emerald-100 overflow-hidden rounded-2xl border border-emerald-100 bg-white">
        {sizes.map((size) => {
          const quantity =
            Number(
              selections[size.key]
            ) || 0;

          return (
            <div
              key={size.key}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="grid min-w-0 flex-1 grid-cols-2 items-center gap-3">
  <span className="text-sm font-black text-gray-700">
    {size.label}
  </span>

  <span className="text-sm font-bold text-gray-900">
    {formatPrice(size.price)}
  </span>
</div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    decrease(size.key)
                  }
                  disabled={quantity === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-black text-gray-700 transition active:scale-95 disabled:opacity-25"
                  aria-label={`Diminuisci ${size.label}`}
                >
                  −
                </button>

                <span className="w-7 text-center text-base font-black text-gray-900">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    increase(size.key)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-xl font-black text-white transition active:scale-95"
                  aria-label={`Aumenta ${size.label}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalQuantity > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-gray-900 p-4 text-white">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">
              Quantità
            </p>

            <p className="mt-1 font-black">
              {totalQuantity}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold uppercase text-gray-400">
              Totale prodotto
            </p>

            <p className="mt-1 text-xl font-black">
              {formatPrice(totalPrice)}
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={saveSelections}
        disabled={
          totalQuantity === 0 &&
          !wasAlreadyInList
        }
        className="mt-4 w-full rounded-2xl bg-green-600 p-4 text-lg font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {totalQuantity === 0
          ? wasAlreadyInList
            ? '🗑️ Rimuovi dalla carrello'
            : 'Seleziona almeno una quantità'
          : wasAlreadyInList
            ? '✓ Aggiorna quantità'
            : '📋 Aggiungi al carrello'}
      </button>

      {message ? (
        <p className="mt-3 text-center text-sm font-black text-green-700">
          {message}
        </p>
      ) : null}
       </div>
  );
}