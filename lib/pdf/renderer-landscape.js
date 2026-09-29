import { PAGE_HEIGHT, PAGE_WIDTH, PDF_THEME } from '@/lib/pdf/theme';
import { categoryLabel, groupProducts, truncateText } from '@/lib/pdf/utils';

const W = PAGE_HEIGHT;
const H = PAGE_WIDTH;
const M = 24;
const GAP = 16;
const HEADER = 92;
const FOOTER = 38;
const COL = (W - M * 2 - GAP) / 2;

function price(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n)
    ? new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(n)
    : null;
}

function prices(product) {
  return [
    ['pz', product.price_unit], ['1g', product.price_1g],
    ['3g', product.price_3g], ['5g', product.price_5g],
    ['10g', product.price_10g], ['20g', product.price_20g],
    ['50g', product.price_50g], ['100g', product.price_100g],
  ].map(([label, value]) => {
    const p = price(value);
    return p ? [label, `${p} EUR`] : null;
  }).filter(Boolean);
}

function metrics(count) {
  if (count <= 12) return { card: 92, image: 72, name: 12, meta: 7.2, price: 7.4, cat: 11, catH: 22, show: true };
  if (count <= 24) return { card: 72, image: 54, name: 10, meta: 6.3, price: 6.5, cat: 9.5, catH: 19, show: true };
  if (count <= 40) return { card: 52, image: 36, name: 8.6, meta: 5.6, price: 5.9, cat: 8.6, catH: 17, show: true };
  return { card: 38, image: 0, name: 7.5, meta: 5.1, price: 5.3, cat: 8, catH: 15, show: false };
}

function drawCover(page, image, x, y, size) {
  if (!image) return;
  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  page.drawImage(image, {
    x: x + (size - width) / 2,
    y: y + (size - height) / 2,
    width,
    height,
  });
}

function drawDots(page, x, y, level) {
  const { colors } = PDF_THEME;
  const value = Math.min(5, Math.max(0, Number(level || 0)));
  for (let i = 0; i < 5; i += 1) {
    page.drawCircle({
      x: x + i * 7,
      y,
      size: 2.3,
      color: i < value ? colors.emerald : colors.white,
      borderColor: colors.emerald,
      borderWidth: 0.55,
    });
  }
}

function drawHeader({ page, logo, qrCode, fonts, count, updatedAt }) {
  const { colors } = PDF_THEME;
  page.drawRectangle({ x: 0, y: H - HEADER, width: W, height: HEADER, color: colors.header });
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: colors.gold });

  if (logo) {
    const scale = Math.min(132 / logo.width, 68 / logo.height);
    const width = logo.width * scale;
    const height = logo.height * scale;
    page.drawImage(logo, { x: M + 4, y: H - HEADER / 2 - height / 2 - 2, width, height });
  }

  const title = 'MENU PREMIUM';
  const size = 21;
  const tw = fonts.title.widthOfTextAtSize(title, size);
  page.drawText(title, { x: W / 2 - tw / 2, y: H - 37, size, font: fonts.title, color: colors.white });
  page.drawLine({ start: { x: W / 2 - 34, y: H - 48 }, end: { x: W / 2 + 34, y: H - 48 }, thickness: 1.4, color: colors.gold });
  page.drawText('QUALITA PREMIUM  |  SELEZIONE CURATA  |  DISCREZIONE', {
    x: W / 2 - 121, y: H - 72, size: 6.2, font: fonts.bold, color: colors.goldSoft,
  });

  const qrSize = 48;
  const qrX = W - M - qrSize;
  const qrY = H - HEADER + 18;
  page.drawText(`Aggiornato: ${updatedAt}`, { x: qrX - 125, y: H - 31, size: 6.5, font: fonts.bold, color: colors.white });
  page.drawText(`${count} ${count === 1 ? 'prodotto attivo' : 'prodotti attivi'}`, { x: qrX - 125, y: H - 46, size: 6.8, font: fonts.bold, color: colors.goldSoft });

  if (qrCode) {
    page.drawRectangle({ x: qrX - 4, y: qrY - 4, width: qrSize + 8, height: qrSize + 8, color: colors.white, borderColor: colors.gold, borderWidth: 1 });
    page.drawImage(qrCode, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  }
}

function drawCategory(page, x, y, label, fonts, m) {
  const { colors } = PDF_THEME;
  page.drawText(label, { x, y: y - 13, size: m.cat, font: fonts.bold, color: colors.emeraldDark });
  const lw = fonts.bold.widthOfTextAtSize(label, m.cat);
  page.drawLine({ start: { x: x + lw + 14, y: y - 9 }, end: { x: x + COL, y: y - 9 }, thickness: 0.9, color: colors.gold });
  return m.catH;
}

function drawPriceGrid(page, entries, x, y, width, fonts, m) {
  const visible = entries.slice(0, 5);
  if (!visible.length) return;
  const cell = width / visible.length;
  visible.forEach(([label, value], i) => {
    const cx = x + i * cell;
    page.drawText(label, { x: cx, y, size: m.price - 0.4, font: fonts.bold, color: PDF_THEME.colors.gray });
    page.drawText(value, { x: cx, y: y - 10, size: m.price, font: fonts.bold, color: PDF_THEME.colors.text });
    if (i < visible.length - 1) {
      page.drawLine({ start: { x: cx + cell - 5, y: y + 2 }, end: { x: cx + cell - 5, y: y - 12 }, thickness: 0.4, color: PDF_THEME.colors.line });
    }
  });
}

function badgeText(product) {
  if (product.price_promo) return `PROMO ${product.price_promo}`;
  if (product.featured) return 'BEST SELLER';
  return '';
}

function drawCard({ page, product, productImage, x, y, fonts, m }) {
  const { colors } = PDF_THEME;
  page.drawRectangle({
    x, y: y - m.card, width: COL, height: m.card - 4,
    color: colors.card,
    borderColor: product.featured ? colors.gold : colors.line,
    borderWidth: product.featured ? 1.15 : 0.7,
  });

  let tx = x + 10;
  let tw = COL - 20;
  if (m.show) {
    const ix = x + 6;
    const iy = y - m.card + 7;
    page.drawRectangle({ x: ix, y: iy, width: m.image, height: m.image, color: colors.emeraldSoft, borderColor: colors.line, borderWidth: 0.5 });
    drawCover(page, productImage, ix, iy, m.image);
    tx = ix + m.image + 10;
    tw = COL - (tx - x) - 10;
  }

  const name = truncateText(product.name || 'Prodotto', m.show ? 28 : 36);
  page.drawText(name, { x: tx, y: y - 15, size: m.name, font: fonts.bold, color: colors.text });

  const code = truncateText(product.id, 12);
  if (code) {
    const cw = fonts.bold.widthOfTextAtSize(code, m.meta);
    page.drawText(code, { x: x + COL - cw - 9, y: y - 14, size: m.meta, font: fonts.bold, color: colors.emerald });
  }

  drawDots(page, tx, y - 28, product.quality_level);

  const meta = [product.thc ? `THC ${product.thc}` : '', product.cbd ? `CBD ${product.cbd}` : ''].filter(Boolean).join('  |  ');
  if (meta) {
    page.drawText(meta, { x: tx + 44, y: y - 30, size: m.meta, font: fonts.bold, color: colors.emeraldDark });
  }

  drawPriceGrid(page, prices(product), tx, y - m.card + 28, tw, fonts, m);

  const badge = badgeText(product);
  if (badge) {
    const text = truncateText(badge, 20);
    const bw = fonts.bold.widthOfTextAtSize(text, m.price);
    page.drawRectangle({ x: x + COL - bw - 19, y: y - m.card + 7, width: bw + 12, height: m.price + 9, color: colors.gold, borderColor: colors.goldDark, borderWidth: 0.4 });
    page.drawText(text, { x: x + COL - bw - 13, y: y - m.card + 11, size: m.price, font: fonts.bold, color: colors.text });
  }

  return m.card;
}

function drawFooter(page, fonts) {
  const { colors } = PDF_THEME;
  page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER, color: colors.header });
  page.drawText('PRODOTTI SELEZIONATI', { x: M, y: 15, size: 6.5, font: fonts.bold, color: colors.white });
  page.drawText('TEST DI LABORATORIO', { x: M + 190, y: 15, size: 6.5, font: fonts.bold, color: colors.white });
  page.drawText('DISCREZIONE ASSOLUTA', { x: M + 380, y: 15, size: 6.5, font: fonts.bold, color: colors.white });
  page.drawText('weedlivero.shop', { x: W - M - 105, y: 15, size: 8.2, font: fonts.bold, color: colors.gold });
}

function estimate(group, m) {
  return m.catH + group[1].length * (m.card + 6) + 4;
}

function balance(groups, m) {
  const cols = [[], []];
  const heights = [0, 0];
  for (const group of groups) {
    const target = heights[0] <= heights[1] ? 0 : 1;
    cols[target].push(group);
    heights[target] += estimate(group, m);
  }
  return cols;
}

function drawColumn({ page, groups, x, images, fonts, m }) {
  let y = H - HEADER - 18;
  const bottom = FOOTER + 12;
  for (const [categoryName, products] of groups) {
    if (y - m.catH < bottom) break;
    y -= drawCategory(page, x, y, categoryLabel(categoryName), fonts, m);
    for (const product of products) {
      if (y - m.card < bottom) break;
      y -= drawCard({ page, product, productImage: images.get(product.id) || null, x, y, fonts, m }) + 6;
    }
    y -= 4;
  }
}

export function renderLandscapeMenu({
  pdfDocument,
  products,
  productImages,
  logo,
  qrCode,
  fonts,
  updatedAt,
}) {
  const m = metrics(products.length);
  const columns = balance(groupProducts(products), m);
  const page = pdfDocument.addPage([W, H]);

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PDF_THEME.colors.background });
  drawHeader({ page, logo, qrCode, fonts, count: products.length, updatedAt });
  drawColumn({ page, groups: columns[0], x: M, images: productImages, fonts, m });
  drawColumn({ page, groups: columns[1], x: M + COL + GAP, images: productImages, fonts, m });
  drawFooter(page, fonts);

  return [page];
}
