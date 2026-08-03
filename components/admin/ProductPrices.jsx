export default function ProductPrices({
  form,
  updateField,
}) {
  const priceFields = [
    {
      field: 'price_1g',
      label: 'Prezzo 1 g',
      placeholder: '10.00',
    },
    {
      field: 'price_3g',
      label: 'Prezzo 3 g',
      placeholder: '25.00',
    },
    {
      field: 'price_5g',
      label: 'Prezzo 5 g',
      placeholder: '40.00',
    },
    {
      field: 'price_10g',
      label: 'Prezzo 10 g',
      placeholder: '75.00',
    },
    {
      field: 'price_20g',
      label: 'Prezzo 20 g',
      placeholder: '140.00',
    },
    {
      field: 'price_50g',
      label: 'Prezzo 50 g',
      placeholder: '300.00',
    },
    {
      field: 'price_100g',
      label: 'Prezzo 100 g',
      placeholder: '550.00',
    },
  ];

  return (
    <section className="rounded-3xl bg-white p-6 shadow-md">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
          Menu PDF
        </p>

        <h2 className="mt-1 text-xl font-black text-gray-900">
          Prezzi e qualità
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Questi valori verranno utilizzati automaticamente nel menu
          PDF aggiornato.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-bold text-gray-700">
            Qualità
          </label>

          <select
            value={form.quality_level ?? ''}
            onChange={(event) =>
              updateField(
                'quality_level',
                event.target.value === ''
                  ? null
                  : Number(event.target.value)
              )
            }
            className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
          >
            <option value="">Non specificata</option>
            <option value="1">★</option>
            <option value="2">★★</option>
            <option value="3">★★★</option>
            <option value="4">★★★★</option>
            <option value="5">★★★★★</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">
            Ordine nel menu
          </label>

          <input
            type="number"
            min="0"
            step="1"
            value={form.menu_order ?? 0}
            onChange={(event) =>
              updateField(
                'menu_order',
                event.target.value === ''
                  ? 0
                  : Number(event.target.value)
              )
            }
            className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
            placeholder="0"
          />

          <p className="mt-2 text-xs text-gray-400">
            I numeri più bassi vengono mostrati prima.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-bold text-gray-700">
          Prezzo unitario
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={form.price_unit ?? ''}
          onChange={(event) =>
            updateField('price_unit', event.target.value)
          }
          className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
          placeholder="Esempio: 15.00"
        />

        <p className="mt-2 text-xs text-gray-400">
          Usalo per prodotti venduti al pezzo, come edibles o vapes.
        </p>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <h3 className="font-black text-gray-900">
          Prezzi per quantità
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Compila soltanto le quantità disponibili per questo
          prodotto.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {priceFields.map((price) => (
            <div key={price.field}>
              <label className="block text-sm font-bold text-gray-700">
                {price.label}
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form[price.field] ?? ''}
                onChange={(event) =>
                  updateField(price.field, event.target.value)
                }
                className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder={price.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <label className="block text-sm font-bold text-gray-700">
          Promozione
        </label>

        <input
          type="text"
          value={form.price_promo || ''}
          onChange={(event) =>
            updateField('price_promo', event.target.value)
          }
          className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
          placeholder="Esempio: 3 × 25 €"
          maxLength={100}
        />

        <p className="mt-2 text-xs text-gray-400">
          Comparirà nel menu soltanto se compilata.
        </p>
      </div>
    </section>
  );
}