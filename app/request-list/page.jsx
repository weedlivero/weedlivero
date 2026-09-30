'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import Header from '@/components/Header';
import TelegramButton from '@/components/TelegramButton';
import RequestContactButtons from '@/components/RequestContactButtons';

import {
  clearRequestList,
  getRequestList,
  removeProductFromRequestList,
  saveRequestList,
} from '@/lib/requestList';

function getCategoryMeta(category) {
  switch (category) {
    case 'weed':
      return {
        emoji: '🌿',
        label: 'Weed',
      };

    case 'hash':
      return {
        emoji: '🟫',
        label: 'Hash',
      };

    case 'concentrate':
      return {
        emoji: '💧',
        label: 'Concentrate',
      };

    case 'edibles':
      return {
        emoji: '🍬',
        label: 'Edibles',
      };

    case 'vapes':
      return {
        emoji: '💨',
        label: 'Vapes',
      };

    default:
      return {
        emoji: '📦',
        label: 'Prodotto',
      };
  }
}

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '€ 0,00';
  }

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
}

function getAvailableSizes(product) {
  const sizes = [
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
  ];

  return sizes.filter((size) => {
    const price = Number(size.price);

    return (
      Number.isFinite(price) &&
      price > 0
    );
  });
}

function getProductTotal(product) {
  if (product.sold_out === true) {
    return 0;
  }

  const sizes = getAvailableSizes(product);

  return sizes.reduce(
    (total, size) => {
      const quantity =
        Number(
          product.selections?.[size.key]
        ) || 0;

      return (
        total +
        Number(size.price) * quantity
      );
    },
    0
  );
}

function getSelectedCount(product) {
  if (product.sold_out === true) {
    return 0;
  }

  return Object.values(
    product.selections || {}
  ).reduce(
    (total, quantity) =>
      total +
      (Number(quantity) || 0),
    0
  );
}

export default function RequestListPage() {
  const [products, setProducts] = useState([]);
  const [checkingAvailability, setCheckingAvailability] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      const savedProducts = getRequestList();

      if (!savedProducts.length) {
        if (!cancelled) {
          setProducts([]);
          setCheckingAvailability(false);
        }

        return;
      }

      try {
        const checkedProducts =
          await Promise.all(
            savedProducts.map(async (savedProduct) => {
              try {
                const response = await fetch(
                  `/api/products/${encodeURIComponent(
                    savedProduct.id
                  )}`,
                  {
                    cache: 'no-store',
                  }
                );

                if (!response.ok) {
                  return savedProduct;
                }

                const result =
                  await response.json();

                const currentProduct =
                  result?.product;

                if (!currentProduct) {
                  return savedProduct;
                }

                /*
                 * Manteniamo nel carrello
                 * le quantità già selezionate,
                 * ma aggiorniamo lo stato reale
                 * del prodotto dal database.
                 */
                if (
                  currentProduct.sold_out === true
                ) {
                  return {
                    ...savedProduct,
                    ...currentProduct,
                    selections: {},
                    sold_out: true,
                  };
                }

                return {
                  ...savedProduct,
                  ...currentProduct,
                  selections:
                    savedProduct.selections || {},
                  sold_out: false,
                };
              } catch (error) {
                console.error(
                  'Errore controllo disponibilità:',
                  savedProduct.id,
                  error
                );

                return savedProduct;
              }
            })
          );

        if (cancelled) {
          return;
        }

        /*
         * Salviamo nel localStorage
         * lo stato aggiornato.
         *
         * In particolare, se un prodotto è
         * diventato esaurito, le quantità
         * precedentemente selezionate vengono
         * azzerate.
         */
        saveRequestList(checkedProducts);

        setProducts(checkedProducts);
      } catch (error) {
        console.error(
          'Errore caricamento carrello:',
          error
        );

        if (!cancelled) {
          setProducts(savedProducts);
        }
      } finally {
        if (!cancelled) {
          setCheckingAvailability(false);
        }
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

  function removeProduct(productId) {
    const nextProducts =
      removeProductFromRequestList(
        productId
      );

    setProducts(nextProducts);
  }

  function clearList() {
    const confirmed =
      window.confirm(
        'Vuoi svuotare tutto il carrello?'
      );

    if (!confirmed) {
      return;
    }

    clearRequestList();
    setProducts([]);
  }

  const orderTotal =
    products.reduce(
      (total, product) =>
        total +
        getProductTotal(product),
      0
    );

  const totalSelections =
    products.reduce(
      (total, product) =>
        total +
        getSelectedCount(product),
      0
    );

  const soldOutProducts =
    products.filter(
      (product) =>
        product.sold_out === true
    );

  const availableProducts =
    products.filter(
      (product) =>
        product.sold_out !== true &&
        getSelectedCount(product) > 0
    );

  return (
    <>
      <Header title="Carrello" />

      <main className="mx-auto max-w-3xl px-5 pb-32 pt-6">
        <Link
          href="/"
          className="text-sm font-bold text-gray-500 transition hover:text-green-700"
        >
          ← Torna al catalogo
        </Link>

        <div className="mt-6">
          <h1 className="text-4xl font-black text-gray-900">
            Il tuo carrello
          </h1>

          <p className="mt-2 text-gray-500">
            {products.length === 1
              ? '1 prodotto nel carrello'
              : `${products.length} prodotti nel carrello`}
          </p>
        </div>

        {checkingAvailability ? (
          <section className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-3xl">
              🛒
            </div>

            <p className="mt-3 font-bold text-gray-600">
              Controllo disponibilità prodotti...
            </p>
          </section>
        ) : products.length === 0 ? (
          <section className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">
              🛒
            </div>

            <h2 className="mt-4 text-2xl font-black text-gray-900">
              Il carrello è vuoto
            </h2>

            <p className="mt-2 text-gray-500">
              Aggiungi uno o più prodotti
              dal catalogo.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-2xl bg-green-600 px-6 py-3 font-black text-white"
            >
              Apri il catalogo
            </Link>
          </section>
        ) : (
          <>
            {soldOutProducts.length > 0 ? (
              <section className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-black uppercase tracking-wide text-red-600">
                  Attenzione
                </p>

                <p className="mt-2 text-sm font-bold text-red-700">
                  {soldOutProducts.length === 1
                    ? 'Un prodotto nel tuo carrello è diventato esaurito.'
                    : `${soldOutProducts.length} prodotti nel tuo carrello sono diventati esauriti.`}
                </p>

                <p className="mt-1 text-sm text-red-600">
                  Non verranno inclusi nella richiesta.
                </p>
              </section>
            ) : null}

            <section className="mt-8 space-y-4">
              {products.map(
                (product) => {
                  const category =
                    getCategoryMeta(
                      product.category
                    );

                  const soldOut =
                    product.sold_out === true;

                  const availableSizes =
                    getAvailableSizes(
                      product
                    );

                  const productTotal =
                    getProductTotal(
                      product
                    );

                  return (
                    <article
                      key={product.id}
                      className={`rounded-3xl border p-4 shadow-sm ${
                        soldOut
                          ? 'border-red-100 bg-red-50/40'
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Link
                          href={`/product/${product.id}`}
                          className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-4xl ${
                            soldOut
                              ? 'grayscale opacity-60'
                              : ''
                          }`}
                        >
                          <img
                            src={`/api/product-image/${encodeURIComponent(
                              product.id
                            )}`}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                'none';

                              const fallback =
                                event
                                  .currentTarget
                                  .nextElementSibling;

                              if (
                                fallback
                              ) {
                                fallback.style.display =
                                  'flex';
                              }
                            }}
                          />

                          <span
                            className="hidden h-full w-full items-center justify-center"
                            aria-hidden="true"
                          >
                            {
                              category.emoji
                            }
                          </span>
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/product/${product.id}`}
                            className="block"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h2 className="text-lg font-black text-gray-900">
                                {
                                  product.name
                                }
                              </h2>

                              {soldOut ? (
                                <span className="shrink-0 rounded-full bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                                  Esaurito
                                </span>
                              ) : null}
                            </div>

                            <p
                              className={`mt-1 text-sm font-bold ${
                                soldOut
                                  ? 'text-red-600'
                                  : 'text-green-700'
                              }`}
                            >
                              {
                                category.emoji
                              }{' '}
                              {
                                category.label
                              }
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {product.brand ||
                                'Brand'}
                            </p>

                            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                              Codice:{' '}
                              {
                                product.id
                              }
                            </p>
                          </Link>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeProduct(
                              product.id
                            )
                          }
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-xl font-black text-red-600 transition active:scale-95"
                          aria-label={`Rimuovi ${product.name} dal carrello`}
                        >
                          ×
                        </button>
                      </div>

                      {product.description ? (
                        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
                          {
                            product.description
                          }
                        </p>
                      ) : null}

                      {soldOut ? (
                        <div className="mt-5 rounded-2xl border border-red-100 bg-white p-5 text-center">
                          <p className="text-lg font-black text-red-600">
                            ESAURITO
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-500">
                            Tornerà presto disponibile.
                          </p>

                          <p className="mt-3 text-xs text-gray-400">
                            Le quantità precedentemente selezionate sono state rimosse e questo prodotto non verrà incluso nella richiesta.
                          </p>
                        </div>
                      ) : availableSizes.length >
                        0 ? (
                        <div className="mt-5 border-t border-gray-100 pt-5">
                          <p className="mb-3 text-sm font-black text-gray-900">
                            Quantità
                            selezionate
                          </p>

                          <div className="space-y-2">
                            {availableSizes
                              .filter(
                                (
                                  size
                                ) =>
                                  Number(
                                    product
                                      .selections?.[
                                      size.key
                                    ]
                                  ) > 0
                              )
                              .map(
                                (
                                  size
                                ) => {
                                  const quantity =
                                    Number(
                                      product
                                        .selections?.[
                                        size.key
                                      ]
                                    ) ||
                                    0;

                                  const subtotal =
                                    Number(
                                      size.price
                                    ) *
                                    quantity;

                                  return (
                                    <div
                                      key={
                                        size.key
                                      }
                                      className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3"
                                    >
                                      <div>
                                        <p className="font-black text-gray-900">
                                          {
                                            size.label
                                          }{' '}
                                          ×{' '}
                                          {
                                            quantity
                                          }
                                        </p>

                                        <p className="mt-1 text-xs font-bold text-gray-400">
                                          {formatPrice(
                                            size.price
                                          )}{' '}
                                          cad.
                                        </p>
                                      </div>

                                      <strong className="text-base text-gray-900">
                                        {formatPrice(
                                          subtotal
                                        )}
                                      </strong>
                                    </div>
                                  );
                                }
                              )}
                          </div>

                          {productTotal >
                          0 ? (
                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 p-4">
                              <span className="font-bold text-emerald-800">
                                Subtotale
                              </span>

                              <strong className="text-xl text-emerald-800">
                                {formatPrice(
                                  productTotal
                                )}
                              </strong>
                            </div>
                          ) : null}

                          <Link
                            href={`/product/${product.id}`}
                            className="mt-3 flex w-full items-center justify-center rounded-2xl border border-green-200 bg-green-50 p-3 font-black text-green-700 transition active:scale-[0.98]"
                          >
                            ✏️ Modifica
                            quantità
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">
                          Nessun prezzo
                          disponibile per
                          questo prodotto.
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </section>

            <section className="mt-6 rounded-3xl bg-gray-900 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-300">
                    Totale ordine
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {totalSelections ===
                    1
                      ? '1 selezione'
                      : `${totalSelections} selezioni`}
                  </p>
                </div>

                <strong className="text-3xl font-black">
                  {formatPrice(
                    orderTotal
                  )}
                </strong>
              </div>
            </section>

            {availableProducts.length >
            0 &&
            totalSelections > 0 ? (
              <RequestContactButtons
                products={availableProducts}
              />
            ) : (
              <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-center text-sm font-bold text-amber-700">
                Seleziona almeno una
                pezzatura per inviare la
                richiesta.
              </div>
            )}

            <section className="mt-3">
              <button
                type="button"
                onClick={clearList}
                className="w-full rounded-2xl bg-red-50 p-4 font-black text-red-700"
              >
                🗑️ Svuota carrello
              </button>
            </section>
          </>
        )}

        <TelegramButton />
      </main>
    </>
  );
}