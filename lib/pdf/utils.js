export const CATEGORY_ORDER = [
  'weed',
  'hash',
  'concentrate',
  'edibles',
  'vapes',
  'other',
];

export function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function truncateText(text, maxLength) {
  const normalized = cleanText(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

export function categoryLabel(category) {
  const labels = {
    weed: 'FLOWER',
    hash: 'HASH',
    concentrate: 'CONCENTRATI',
    edibles: 'EDIBLES',
    vapes: 'VAPES',
    other: 'ALTRI',
  };

  return labels[category] || cleanText(category).toUpperCase() || 'ALTRI';
}

export function formatDate() {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Rome',
  }).format(new Date());
}

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
}

export function buildPriceText(product) {
  return [
    ['pz', product.price_unit],
    ['1g', product.price_1g],
    ['3g', product.price_3g],
    ['5g', product.price_5g],
    ['10g', product.price_10g],
    ['20g', product.price_20g],
    ['50g', product.price_50g],
    ['100g', product.price_100g],
  ]
    .map(([label, value]) => {
      const price = formatPrice(value);
      return price ? `${label} ${price} EUR` : null;
    })
    .filter(Boolean)
    .join('  |  ');
}

export function buildMetaText(product) {
  return [
    product.thc ? `THC ${cleanText(product.thc)}` : '',
    product.cbd ? `CBD ${cleanText(product.cbd)}` : '',
  ].filter(Boolean).join('  |  ');
}

export function groupProducts(products) {
  const groups = new Map();
  for (const product of products) {
    const category = product.category || 'other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(product);
  }

  return [...groups.entries()].sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export function sortProducts(products) {
  return [...products].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category || 'other');
    const bi = CATEGORY_ORDER.indexOf(b.category || 'other');
    if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);

    const ao = Number(a.menu_order || 0);
    const bo = Number(b.menu_order || 0);
    if (ao !== bo) return ao - bo;

    return cleanText(a.name).localeCompare(cleanText(b.name), 'it');
  });
}
