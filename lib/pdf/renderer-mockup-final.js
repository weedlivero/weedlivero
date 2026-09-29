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

const MARGIN = 20;
const GAP = 14;
const HEADER = 116;
const FOOTER = 46;
const COL_WIDTH = (PAGE_WIDTH - MARGIN * 2 - GAP) / 2;

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  return new Intl.NumberFormat('it-IT', {
    maximumFractionDigits: 2,
  }).format(number);
}

function getPrices(product) {
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
      return price ? [label, `${price} EUR`] : null;
    })
    .filter(Boolean);
}

function getMetrics(count) {
  if (count <= 8) {
    return {
      cardHeight: 124,
      imageWidth: 76,
      nameSize: 12.2,
      codeSize: 6.8,
      metaSize: 6.8,
      priceSize: 7.1,
      descSize: 6.4,
      categorySize: 11,
      categoryHeight: 24,
      showImages: true,
      showDescriptions: true,
    };
  }

  if (count <= 14) {
    return {
      cardHeight: 98,
      imageWidth: 62,
      nameSize: 10.2,
      codeSize: 6.2,
      metaSize: 6.1,
      priceSize: 6.4,
      descSize: 5.8,
      categorySize: 9.8,
      categoryHeight: 21,
      showImages: true,
      showDescriptions: true,
    };
  }

  if (count <= 24) {
    return {
      cardHeight: 72,
      imageWidth: 46,
      nameSize: 8.8,
      codeSize: 5.6,
      metaSize: 5.5,
      priceSize: 5.8,
      descSize: 0,
      categorySize: 8.8,
      categoryHeight: 18,
      showImages: true,
      showDescriptions: false,
    };
  }

  return {
    cardHeight: 48,
    imageWidth: 0,
    nameSize: 7.6,
    codeSize: 5.1,
    metaSize: 5,
    priceSize: 5.3,
    descSize: 0,
    categorySize: 8,
    categoryHeight: 16,
    showImages: false,
    showDescriptions: false,
  };
}

function drawImageContain(page, image, x, y, width, height) {
  if (!image) return;

  const padding = 3;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

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

function drawHeader({
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
      136 / logo.width,
      84 / logo.height
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

  const titleText = 'MENU PREMIUM';
  const titleSize = 22;
  const titleWidth =
    fonts.title.widthOfTextAtSize(titleText, titleSize);

  page.drawText(titleText, {
    x: PAGE_WIDTH / 2 - titleWidth / 2,
    y: PAGE_HEIGHT - 42,
    size: titleSize,
    font: fonts.title,
    color: colors.white,
  });

  page.drawLine({
    start: {
      x: PAGE_WIDTH / 2 - 34,
      y: PAGE_HEIGHT - 54,
    },
    end: {
      x: PAGE_WIDTH / 2 + 34,
      y: PAGE_HEIGHT - 54,
    },
    thickness: 1.5,
    color: colors.gold,
  });

  page.drawText(
    'QUALITA PREMIUM  |  SELEZIONE CURATA  |  DISCREZIONE',
    {
      x: PAGE_WIDTH / 2 - 123,
      y: PAGE_HEIGHT - 88,
      size: 6.2,
      font: fonts.bold,
      color: colors.goldSoft,
    }
  );

  const qrSize = 50;
  const qrX = PAGE_WIDTH - MARGIN - qrSize;
  const qrY = PAGE_HEIGHT - HEADER + 22;

  page.drawText(`Aggiornato: ${updatedAt}`, {
    x: qrX - 122,
    y: PAGE_HEIGHT - 33,
    size: 6.5,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText(
    `${productCount} ${productCount === 1 ? 'prodotto attivo' : 'prodotti attivi'}`,
    {
      x: qrX - 122,
      y: PAGE_HEIGHT - 49,
      size: 6.8,
      font: fonts.bold,
      color: colors.goldSoft,
    }
  );

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

    page.drawText('CATALOGO ONLINE', {
      x: qrX - 1,
      y: qrY - 13,
      size: 5.1,
      font: fonts.bold,
      color: colors.goldSoft,
    });
  }
}

function drawCategoryHeader({
  page,
  x,
  y,
  label,
  fonts,
  metrics,
}) {
  const { colors } = PDF_THEME;

  page.drawText(label, {
    x,
    y: y - 13,
    size: metrics.categorySize,
    font: fonts.bold,
    color: colors.emeraldDark,
  });

  const labelWidth =
    fonts.bold.widthOfTextAtSize(label, metrics.categorySize);

  page.drawLine({
    start: {
      x: x + labelWidth + 14,
      y: y - 9,
    },
    end: {
      x: x + COL_WIDTH,
      y: y - 9,
    },
    thickness: 0.9,
    color: colors.gold,
  });

  return metrics.categoryHeight;
}

function drawQualityDots(page, x, y, level) {
  const { colors } = PDF_THEME;
  const value = Math.min(5, Math.max(0, Number(level || 0)));

  for (let i = 0; i < 5; i += 1) {
    page.drawCircle({
      x: x + i * 8,
      y,
      size: 2.5,
      color: i < value ? colors.emerald : colors.white,
      borderColor: colors.emerald,
      borderWidth: 0.6,
    });
  }
}

function drawPriceGrid({
  page,
  product,
  x,
  y,
  width,
  fonts,
  metrics,
}) {
  const entries = getPrices(product).slice(0, 5);
  if (!entries.length) return;

  const cellWidth = width / entries.length;

  entries.forEach(([label, value], index) => {
    const cellX = x + index * cellWidth;

    page.drawText(label, {
      x: cellX,
      y,
      size: metrics.priceSize - 0.5,
      font: fonts.bold,
      color: PDF_THEME.colors.gray,
    });

    page.drawText(value, {
      x: cellX,
      y: y - 10,
      size: metrics.priceSize,
      font: fonts.bold,
      color: PDF_THEME.colors.text,
    });

    if (index < entries.length - 1) {
      page.drawLine({
        start: {
          x: cellX + cellWidth - 5,
          y: y + 2,
        },
        end: {
          x: cellX + cellWidth - 5,
          y: y - 13,
        },
        thickness: 0.45,
        color: PDF_THEME.colors.line,
      });
    }
  });
}

function getBadge(product) {
  if (product.price_promo) return `PROMO ${product.price_promo}`;
  if (product.featured) return 'BEST SELLER';
  return '';
}

function drawBadge({
  page,
  text,
  x,
  y,
  fonts,
  metrics,
}) {
  if (!text) return;

  const label = truncateText(text, 18);
  const textWidth =
    fonts.bold.widthOfTextAtSize(label, metrics.priceSize);

  page.drawRectangle({
    x: x - textWidth - 12,
    y,
    width: textWidth + 12,
    height: metrics.priceSize + 9,
    color: PDF_THEME.colors.gold,
    borderColor: PDF_THEME.colors.goldDark,
    borderWidth: 0.4,
  });

  page.drawText(label, {
    x: x - textWidth - 6,
    y: y + 4,
    size: metrics.priceSize,
    font: fonts.bold,
    color: PDF_THEME.colors.text,
  });
}

function drawCard({
  page,
  product,
  image,
  x,
  y,
  fonts,
  metrics,
}) {
  const { colors } = PDF_THEME;

  page.drawRectangle({
    x,
    y: y - metrics.cardHeight,
    width: COL_WIDTH,
    height: metrics.cardHeight - 4,
    color: colors.card,
    borderColor: product.featured ? colors.gold : colors.line,
    borderWidth: product.featured ? 1.1 : 0.7,
  });

  let textX = x + 10;
  let usableWidth = COL_WIDTH - 20;

  if (metrics.showImages) {
    const imageX = x + 6;
    const imageY = y - metrics.cardHeight + 7;
    const imageHeight = metrics.cardHeight - 14;

    page.drawRectangle({
      x: imageX,
      y: imageY,
      width: metrics.imageWidth,
      height: imageHeight,
      color: colors.emeraldSoft,
      borderColor: colors.line,
      borderWidth: 0.5,
    });

    drawImageContain(
      page,
      image,
      imageX,
      imageY,
      metrics.imageWidth,
      imageHeight
    );

    textX = imageX + metrics.imageWidth + 10;
    usableWidth = COL_WIDTH - (textX - x) - 10;
  }

  const name = truncateText(
    product.name || 'Prodotto',
    metrics.showImages ? 24 : 34
  );

  page.drawText(name, {
    x: textX,
    y: y - 16,
    size: metrics.nameSize,
    font: fonts.bold,
    color: colors.text,
  });

  const code = truncateText(product.id, 12);

  if (code) {
    const codeWidth =
      fonts.bold.widthOfTextAtSize(code, metrics.codeSize);

    page.drawText(code, {
      x: x + COL_WIDTH - codeWidth - 9,
      y: y - 15,
      size: metrics.codeSize,
      font: fonts.bold,
      color: colors.emerald,
    });
  }

  drawQualityDots(
    page,
    textX,
    y - 31,
    product.quality_level
  );

  const meta = [
    product.thc ? `THC ${product.thc}` : '',
    product.cbd ? `CBD ${product.cbd}` : '',
  ]
    .filter(Boolean)
    .join('  |  ');

  if (meta) {
    page.drawText(meta, {
      x: textX + 46,
      y: y - 33,
      size: metrics.metaSize,
      font: fonts.bold,
      color: colors.emeraldDark,
    });
  }

  const priceY = y - metrics.cardHeight + 31;

  drawPriceGrid({
    page,
    product,
    x: textX,
    y: priceY,
    width: usableWidth,
    fonts,
    metrics,
  });

  if (metrics.showDescriptions && product.description) {
    page.drawText(
      truncateText(product.description, 58),
      {
        x: textX,
        y: y - metrics.cardHeight + 14,
        size: metrics.descSize,
        font: fonts.regular,
        color: colors.gray,
      }
    );
  }

  drawBadge({
    page,
    text: getBadge(product),
    x: x + COL_WIDTH - 7,
    y: y - metrics.cardHeight + 7,
    fonts,
    metrics,
  });

  return metrics.cardHeight;
}

function drawFooter({
  page,
  fonts,
  pageNumber,
  totalPages,
}) {
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
    y: 16,
    size: 6.3,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText('TEST DI LABORATORIO', {
    x: MARGIN + 138,
    y: 16,
    size: 6.3,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText('DISCREZIONE ASSOLUTA', {
    x: MARGIN + 272,
    y: 16,
    size: 6.3,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText('weedlivero.shop', {
    x: PAGE_WIDTH - MARGIN - 102,
    y: 16,
    size: 8,
    font: fonts.bold,
    color: colors.gold,
  });

  page.drawText(`${pageNumber}/${totalPages}`, {
    x: PAGE_WIDTH - MARGIN - 16,
    y: 16,
    size: 6.2,
    font: fonts.bold,
    color: colors.goldSoft,
  });
}

function estimateGroupHeight(group, metrics) {
  const [, products] = group;

  return (
    metrics.categoryHeight +
    products.length * (metrics.cardHeight + 6) +
    4
  );
}

function balanceGroups(groups, metrics) {
  const columns = [[], []];
  const heights = [0, 0];

  for (const group of groups) {
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push(group);
    heights[target] += estimateGroupHeight(group, metrics);
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
  metrics,
}) {
  let y = startY;

  for (const [category, products] of groups) {
    if (y - metrics.categoryHeight < bottom) {
      return false;
    }

    y -= drawCategoryHeader({
      page,
      x,
      y,
      label: categoryLabel(category),
      fonts,
      metrics,
    });

    for (const product of products) {
      if (y - metrics.cardHeight < bottom) {
        return false;
      }

      y -=
        drawCard({
          page,
          product,
          image: productImages.get(product.id) || null,
          x,
          y,
          fonts,
          metrics,
        }) + 6;
    }

    y -= 4;
  }

  return true;
}

export function renderMockupFinal({
  pdfDocument,
  products,
  productImages,
  logo,
  qrCode,
  fonts,
  updatedAt,
}) {
  const metrics = getMetrics(products.length);
  const groups = groupProducts(products);
  const pages = [];

  const columns = balanceGroups(groups, metrics);

  const page = pdfDocument.addPage([
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ]);

  pages.push(page);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: PDF_THEME.colors.background,
  });

  drawHeader({
    page,
    logo,
    qrCode,
    fonts,
    productCount: products.length,
    updatedAt,
  });

  const startY = PAGE_HEIGHT - HEADER - 17;
  const bottom = FOOTER + 10;

  drawColumn({
    page,
    groups: columns[0],
    x: MARGIN,
    startY,
    bottom,
    productImages,
    fonts,
    metrics,
  });

  drawColumn({
    page,
    groups: columns[1],
    x: MARGIN + COL_WIDTH + GAP,
    startY,
    bottom,
    productImages,
    fonts,
    metrics,
  });

  drawFooter({
    page,
    fonts,
    pageNumber: 1,
    totalPages: 1,
  });

  return pages;
}
