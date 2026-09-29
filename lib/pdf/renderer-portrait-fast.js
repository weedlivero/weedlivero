import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  PDF_THEME,
} from '@/lib/pdf/theme';

import {
  categoryLabel,
  groupProducts,
  truncateText,
} from '@/lib/pdf/utils';

const MARGIN = 24;
const GAP = 12;
const HEADER = 112;
const FOOTER = 42;
const COL_WIDTH = (PAGE_WIDTH - MARGIN * 2 - GAP) / 2;

function price(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  return new Intl.NumberFormat('it-IT', {
    maximumFractionDigits: 2,
  }).format(n);
}

function priceEntries(product) {
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
      const formatted = price(value);
      return formatted ? [label, `${formatted} EUR`] : null;
    })
    .filter(Boolean);
}

function metrics(count) {
  if (count <= 12) {
    return {
      card: 78,
      image: 58,
      name: 10.4,
      small: 6.2,
      price: 6.3,
      category: 20,
      showImages: true,
    };
  }

  if (count <= 24) {
    return {
      card: 62,
      image: 44,
      name: 9,
      small: 5.7,
      price: 5.9,
      category: 18,
      showImages: true,
    };
  }

  if (count <= 44) {
    return {
      card: 44,
      image: 0,
      name: 8,
      small: 5.2,
      price: 5.5,
      category: 16,
      showImages: false,
    };
  }

  return {
    card: 34,
    image: 0,
    name: 7.1,
    small: 4.8,
    price: 5.1,
    category: 14,
    showImages: false,
  };
}

function cover(page, image, x, y, width, height) {
  if (!image) {
    return;
  }

  const padding = 3;

  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  // "Contain": l'immagine resta interamente dentro il riquadro
  const scale = Math.min(
    availableWidth / image.width,
    availableHeight / image.height
  );

  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  page.drawImage(image, {
    x: x + (width - drawWidth) / 2,
    y: y + (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  });
}
function header({
  page,
  logo,
  qrCode,
  fonts,
  productCount,
  updatedAt,
}) {
  const { colors } = PDF_THEME;

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER,
    width: PAGE_WIDTH,
    height: HEADER,
    color: colors.header,
  });

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 6,
    width: PAGE_WIDTH,
    height: 6,
    color: colors.gold,
  });

  if (logo) {
    const scale = Math.min(
      128 / logo.width,
      82 / logo.height
    );

    const width = logo.width * scale;
    const height = logo.height * scale;

    page.drawImage(logo, {
      x: MARGIN + 2,
      y: PAGE_HEIGHT - HEADER / 2 - height / 2 - 2,
      width,
      height,
    });
  }

  const title = 'MENU PREMIUM';
  const titleSize = 21;
  const titleWidth =
    fonts.title.widthOfTextAtSize(title, titleSize);

  page.drawText(title, {
    x: PAGE_WIDTH / 2 - titleWidth / 2,
    y: PAGE_HEIGHT - 41,
    size: titleSize,
    font: fonts.title,
    color: colors.white,
  });

  page.drawLine({
    start: { x: PAGE_WIDTH / 2 - 34, y: PAGE_HEIGHT - 52 },
    end: { x: PAGE_WIDTH / 2 + 34, y: PAGE_HEIGHT - 52 },
    thickness: 1.5,
    color: colors.gold,
  });

  page.drawText(
    'QUALITA PREMIUM  |  SELEZIONE CURATA  |  DISCREZIONE',
    {
      x: PAGE_WIDTH / 2 - 122,
      y: PAGE_HEIGHT - 87,
      size: 6.2,
      font: fonts.bold,
      color: colors.goldSoft,
    }
  );

  const qrSize = 48;
  const qrX = PAGE_WIDTH - MARGIN - qrSize;
  const qrY = PAGE_HEIGHT - HEADER + 20;

  page.drawText(`Aggiornato: ${updatedAt}`, {
    x: qrX - 118,
    y: PAGE_HEIGHT - 33,
    size: 6.3,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText(`${productCount} prodotti attivi`, {
    x: qrX - 118,
    y: PAGE_HEIGHT - 48,
    size: 6.7,
    font: fonts.bold,
    color: colors.goldSoft,
  });

  if (qrCode) {
    page.drawRectangle({
      x: qrX - 4,
      y: qrY - 4,
      width: qrSize + 8,
      height: qrSize + 8,
      color: colors.white,
      borderColor: colors.gold,
      borderWidth: 1,
    });

    page.drawImage(qrCode, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
  }
}

function categoryHeader(page, x, y, label, fonts, m) {
  const { colors } = PDF_THEME;
  const size = Math.max(8, m.name);

  page.drawText(label, {
    x,
    y: y - 12,
    size,
    font: fonts.bold,
    color: colors.emeraldDark,
  });

  const labelWidth = fonts.bold.widthOfTextAtSize(label, size);

  page.drawLine({
    start: { x: x + labelWidth + 12, y: y - 9 },
    end: { x: x + COL_WIDTH, y: y - 9 },
    thickness: 0.9,
    color: colors.gold,
  });

  return m.category;
}

function dots(page, x, y, level) {
  const { colors } = PDF_THEME;
  const value = Math.min(5, Math.max(0, Number(level || 0)));

  for (let i = 0; i < 5; i += 1) {
    page.drawCircle({
      x: x + i * 7,
      y,
      size: 2.2,
      color: i < value ? colors.emerald : colors.white,
      borderColor: colors.emerald,
      borderWidth: 0.55,
    });
  }
}

function prices(page, entries, x, y, width, fonts, m) {
  if (!entries.length) return;

  const visible = entries.slice(0, 5);
  const cell = width / visible.length;

  visible.forEach(([label, value], index) => {
    const cellX = x + index * cell;

    page.drawText(label, {
      x: cellX,
      y,
      size: m.price - 0.4,
      font: fonts.bold,
      color: PDF_THEME.colors.gray,
    });

    page.drawText(value, {
      x: cellX,
      y: y - 10,
      size: m.price,
      font: fonts.bold,
      color: PDF_THEME.colors.text,
    });
  });
}

function badge(page, product, x, y, fonts, m) {
  const text = product.price_promo
    ? `PROMO ${product.price_promo}`
    : product.featured
      ? 'BEST SELLER'
      : '';

  if (!text) return;

  const label = truncateText(text, 18);
  const width =
    fonts.bold.widthOfTextAtSize(label, m.price);

  page.drawRectangle({
    x: x - width - 10,
    y,
    width: width + 10,
    height: m.price + 8,
    color: PDF_THEME.colors.gold,
    borderColor: PDF_THEME.colors.goldDark,
    borderWidth: 0.4,
  });

  page.drawText(label, {
    x: x - width - 5,
    y: y + 4,
    size: m.price,
    font: fonts.bold,
    color: PDF_THEME.colors.text,
  });
}

function card({
  page,
  product,
  image,
  x,
  y,
  fonts,
  m,
}) {
  const { colors } = PDF_THEME;

  page.drawRectangle({
    x,
    y: y - m.card,
    width: COL_WIDTH,
    height: m.card - 4,
    color: colors.card,
    borderColor: product.featured ? colors.gold : colors.line,
    borderWidth: product.featured ? 1.1 : 0.7,
  });

  let textX = x + 9;
  let usable = COL_WIDTH - 18;

  if (m.showImages) {
    const imageX = x + 6;
    const imageY = y - m.card + 7;
    const imageH = m.card - 14;

    page.drawRectangle({
      x: imageX,
      y: imageY,
      width: m.image,
      height: imageH,
      color: colors.emeraldSoft,
      borderColor: colors.line,
      borderWidth: 0.5,
    });

    cover(page, image, imageX, imageY, m.image, imageH);

    textX = imageX + m.image + 9;
    usable = COL_WIDTH - (textX - x) - 9;
  }

  const name = truncateText(
    product.name || 'Prodotto',
    m.showImages ? 24 : 32
  );

  page.drawText(name, {
    x: textX,
    y: y - 14,
    size: m.name,
    font: fonts.bold,
    color: colors.text,
  });

  const code = truncateText(product.id, 12);

  if (code) {
    const width =
      fonts.bold.widthOfTextAtSize(code, m.small);

    page.drawText(code, {
      x: x + COL_WIDTH - width - 8,
      y: y - 13,
      size: m.small,
      font: fonts.bold,
      color: colors.emerald,
    });
  }

  dots(page, textX, y - 27, product.quality_level);

  const meta = [
    product.thc ? `THC ${product.thc}` : '',
    product.cbd ? `CBD ${product.cbd}` : '',
  ]
    .filter(Boolean)
    .join('  |  ');

  if (meta) {
    page.drawText(meta, {
      x: textX + 44,
      y: y - 29,
      size: m.small,
      font: fonts.bold,
      color: colors.emeraldDark,
    });
  }

  prices(
    page,
    priceEntries(product),
    textX,
    y - m.card + 27,
    usable,
    fonts,
    m
  );

  badge(
    page,
    product,
    x + COL_WIDTH - 7,
    y - m.card + 7,
    fonts,
    m
  );

  return m.card;
}

function footer(page, fonts, pageNumber, totalPages) {
  const { colors } = PDF_THEME;

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: FOOTER,
    color: colors.header,
  });

  page.drawText('PRODOTTI SELEZIONATI', {
    x: MARGIN,
    y: 15,
    size: 6.3,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText('TEST DI LABORATORIO', {
    x: MARGIN + 140,
    y: 15,
    size: 6.3,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText('DISCREZIONE ASSOLUTA', {
    x: MARGIN + 275,
    y: 15,
    size: 6.3,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText('weedlivero.shop', {
    x: PAGE_WIDTH - MARGIN - 102,
    y: 15,
    size: 8,
    font: fonts.bold,
    color: colors.gold,
  });

  page.drawText(`${pageNumber}/${totalPages}`, {
    x: PAGE_WIDTH - MARGIN - 16,
    y: 15,
    size: 6.2,
    font: fonts.bold,
    color: colors.goldSoft,
  });
}

function estimate(group, m) {
  const [, products] = group;

  return (
    m.category +
    products.length * (m.card + 5) +
    4
  );
}

function balance(groups, m) {
  const columns = [[], []];
  const heights = [0, 0];

  for (const group of groups) {
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push(group);
    heights[target] += estimate(group, m);
  }

  return columns;
}

function drawColumn({
  page,
  groups,
  x,
  startY,
  bottom,
  productImages,
  fonts,
  m,
}) {
  let y = startY;

  for (const [category, products] of groups) {
    y -= categoryHeader(
      page,
      x,
      y,
      categoryLabel(category),
      fonts,
      m
    );

    for (const product of products) {
      if (y - m.card < bottom) return false;

      y -= card({
        page,
        product,
        image: productImages.get(product.id) || null,
        x,
        y,
        fonts,
        m,
      }) + 5;
    }

    y -= 4;
  }

  return true;
}

export function renderPortraitFast({
  pdfDocument,
  products,
  productImages,
  logo,
  qrCode,
  fonts,
  updatedAt,
}) {
  const m = metrics(products.length);
  const groups = groupProducts(products);
  const columns = balance(groups, m);

  const page = pdfDocument.addPage([
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: PDF_THEME.colors.background,
  });

  header({
    page,
    logo,
    qrCode,
    fonts,
    productCount: products.length,
    updatedAt,
  });

  const startY = PAGE_HEIGHT - HEADER - 16;
  const bottom = FOOTER + 10;

  drawColumn({
    page,
    groups: columns[0],
    x: MARGIN,
    startY,
    bottom,
    productImages,
    fonts,
    m,
  });

  drawColumn({
    page,
    groups: columns[1],
    x: MARGIN + COL_WIDTH + GAP,
    startY,
    bottom,
    productImages,
    fonts,
    m,
  });

  footer(page, fonts, 1, 1);

  return [page];
}
