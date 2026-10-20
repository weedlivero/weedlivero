import { getCustomerSession, customerDb, isSameOrigin, noStore } from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Endpoint sperimentale: non collegare ai pulsanti prima dei test.
const SIZES = Object.freeze({
  unit: 'price_unit', '1g': 'price_1g', '3g': 'price_3g',
  '5g': 'price_5g', '10g': 'price_10g', '20g': 'price_20g',
  '50g': 'price_50g', '100g': 'price_100g',
});
const MAX_PRODUCTS = 30;
const MAX_QUANTITY_PER_SIZE = 100;
const MAX_TOTAL_ITEMS = 300;
const MAX_BODY_BYTES = 16 * 1024;

function reject(message, status = 400) { return noStore({ error: message }, status); }

export async function POST(request) {
  // Off by default, including in local development.
  if (process.env.CUSTOMER_ORDER_PREVIEW_ENABLED !== 'true') {
    return reject('Preparazione ordini non ancora disponibile.', 503);
  }
  if (!isSameOrigin(request)) return reject('Origine non autorizzata.', 403);
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    return reject('Formato richiesta non valido.', 415);
  }

  try {
    const session = await getCustomerSession();
    if (!session || session.account.must_change_password) return reject('Accesso cliente richiesto.', 401);

    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return reject('Richiesta troppo grande.', 413);
    let body;
    try { body = JSON.parse(raw); } catch { return reject('JSON non valido.'); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || !Array.isArray(body.products)) {
      return reject('Elenco prodotti non valido.');
    }
    if (body.products.length < 1 || body.products.length > MAX_PRODUCTS) {
      return reject('Numero prodotti non valido.');
    }

    const requested = new Map();
    let itemCount = 0;
    for (const entry of body.products) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return reject('Prodotto non valido.');
      const id = entry.id;
      const selections = entry.selections;
      if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(id) || requested.has(id)) {
        return reject('Codice prodotto non valido o duplicato.');
      }
      if (!selections || typeof selections !== 'object' || Array.isArray(selections)) {
        return reject('Quantita non valide.');
      }
      const pairs = Object.entries(selections);
      if (!pairs.length || pairs.length > Object.keys(SIZES).length) return reject('Selezioni non valide.');
      for (const [size, quantity] of pairs) {
        if (!Object.hasOwn(SIZES, size) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_SIZE) {
          return reject('Pezzatura o quantita non valida.');
        }
        itemCount += quantity;
        if (itemCount > MAX_TOTAL_ITEMS) return reject('Quantita totale eccessiva.');
      }
      requested.set(id, selections);
    }

    const db = customerDb();
    const { data, error } = await db.from('products')
      .select('id,name,category,active,sold_out,price_unit,price_1g,price_3g,price_5g,price_10g,price_20g,price_50g,price_100g')
      .in('id', [...requested.keys()]);
    if (error) throw error;
    if (!data || data.length !== requested.size) return reject('Uno o piu prodotti non sono disponibili.', 409);

    const productsById = new Map(data.map(product => [product.id, product]));
    const lines = [];
    let totalCents = 0;
    for (const [id, selections] of requested) {
      const product = productsById.get(id);
      if (!product || product.active !== true || product.sold_out === true) {
        return reject('Uno o piu prodotti non sono disponibili.', 409);
      }
      const items = [];
      let subtotalCents = 0;
      for (const [size, quantity] of Object.entries(selections)) {
        const price = Number(product[SIZES[size]]);
        if (!Number.isFinite(price) || price <= 0 || price > 100000 || Math.abs(price * 100 - Math.round(price * 100)) > 0.00001) {
          return reject('Prezzo non disponibile per una pezzatura.', 409);
        }
        const priceCents = Math.round(price * 100);
        const lineCents = priceCents * quantity;
        subtotalCents += lineCents;
        items.push({ size, quantity, unitPrice: priceCents / 100, subtotal: lineCents / 100 });
      }
      totalCents += subtotalCents;
      lines.push({ id: product.id, name: product.name, category: product.category, selections: items, subtotal: subtotalCents / 100 });
    }
    return noStore({ success: true, currency: 'EUR', products: lines, total: totalCents / 100 });
  } catch (error) {
    console.error('Preparazione ordine:', error?.code || error?.message);
    return reject('Preparazione ordine temporaneamente non disponibile.', 503);
  }
}
