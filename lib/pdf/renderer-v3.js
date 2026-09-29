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

const PAGE_MARGIN = 24;
const COLUMN_GAP = 16;
const HEADER_HEIGHT = 118;
const FOOTER_HEIGHT = 42;
const COLUMN_WIDTH =
  (PAGE_WIDTH - PAGE_MARGIN * 2 - COLUMN_GAP) / 2;

function getMetrics(productCount) {
  if (productCount <= 10) {
    return {
      cardHeight: 86,
      imageWidth: 58,
      nameSize: 10.5,
      codeSize: 6.6,
      metaSize: 6.4,
      priceSize: 6.6,
      categorySize: 10.5,
      categoryHeight: 22,
      showImages: true,
    };
  }

  if (productCount <= 18) {
    return {
      cardHeight: 72,
      imageWidth: 48,
      nameSize: 9.4,
      codeSize: 6.1,
      metaSize: 5.9,
      priceSize: 6.1,
      categorySize: 9.6,
      categoryHeight: 20,
      showImages: true,
    };
  }

  if (productCount <= 32) {
    return {
      cardHeight: 54,
      imageWidth: 36,
      nameSize: 8.4,
      codeSize: 5.6,
      metaSize: 5.4,
      priceSize: 5.6,
      categorySize: 8.8,
      categoryHeight: 18,
      showImages: true,
    };
  }

  return {
    cardHeight: 38,
    imageWidth: 0,
    nameSize: 7.4,
    codeSize: 5.1,
    metaSize: 5,
    priceSize: 5.2,
    categorySize: 8,
    categoryHeight: 16,
    showImages: false,
  };
}

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return new Intl.NumberFormat('it-IT', {
    maximumFractionDigits: 2,
  }).format(numeric);
}

function getPriceEntries(product) {
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

function drawHeader({
  page,
  logo,
  qrCode,
  fonts,
  productCount,
  updatedAt,
}) {
  const { colors } = PDF_THEME;
  const { bold, title } = fonts;

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: HEADER_HEIGHT,
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
      138 / logo.width,
      84 / logo.height
    );

    const width = logo.width * scale;
    const height = logo.height * scale;

    page.drawImage(logo, {
      x: PAGE_MARGIN + 2,
      y: PAGE_HEIGHT - HEADER_HEIGHT / 2 - height / 2 - 2,
      width,
      height,
    });
  }

  const titleText = 'MENU PREMIUM';
  const titleSize = 22;
  const titleWidth =
    title.widthOfTextAtSize(titleText, titleSize);

  page.drawText(titleText, {
    x: PAGE_WIDTH / 2 - titleWidth / 2,
    y: PAGE_HEIGHT - 42,
    size: titleSize,
    font: title,
    color: colors.white,
  });

  page.drawLine({
    start: {
      x: PAGE_WIDTH / 2 - 34,
      y: PAGE_HEIGHT - 53,
    },
    end: {
      x: PAGE_WIDTH / 2 + 34,
      y: PAGE_HEIGHT - 53,
    },
    thickness: 1.5,
    color: colors.gold,
  });

  page.drawText(
    'QUALITA PREMIUM  |  SELEZIONE CURATA  |  DISCREZIONE',
    {
      x: PAGE_WIDTH / 2 - 123,
      y: PAGE_HEIGHT - 87,
      size: 6.2,
      font: bold,
      color: colors.goldSoft,
    }
  );

  const qrSize = 49;
  const qrX = PAGE_WIDTH - PAGE_MARGIN - qrSize;
  const qrY = PAGE_HEIGHT - HEADER_HEIGHT + 22;

  page.drawText(`Aggiornato: ${updatedAt}`, {
    x: qrX - 121,
    y: PAGE_HEIGHT - 33,
    size: 6.4,
    font: bold,
    color: colors.white,
  });

  page.drawText(
    `${productCount} ${
      productCount === 1
        ? 'prodotto attivo'
        : 'prodotti attivi'
    }`,
    {
      x: qrX - 121,
      y: PAGE_HEIGHT - 48,
      size: 6.8,
      font: bold,
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
      font: bold,
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
    fonts.bold.widthOfTextAtSize(
      label,
      metrics.categorySize
    );

  page.drawLine({
    start: {
      x: x + labelWidth + 13,
      y: y - 9,
    },
    end: {
      x: x + COLUMN_WIDTH,
      y: y - 9,
    },
    thickness: 0.9,
    color: colors.gold,
  });

  return metrics.categoryHeight;
}

function drawQualityDots({
  page,
  x,
  y,
  level,
}) {
  const { colors } = PDF_THEME;

  const value = Math.min(
    5,
    Math.max(0, Number(level || 0))
  );

  for (let index = 0; index < 5; index += 1) {
    page.drawCircle({
      x: x + index * 7,
      y,
      size: 2.2,
      color:
        index < value
          ? colors.emerald
          : colors.white,
      borderColor: colors.emerald,
      borderWidth: 0.55,
    });
  }
}

function drawImageCover({
  page,
  image,
  x,
  y,
  width,
  height,
}) {
  if (!image) return;

  const scale = Math.max(
    width / image.width,
    height / image.height
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

function drawPriceGrid({
  page,
  entries,
  x,
  y,
  width,
  fonts,
  metrics,
}) {
  if (!entries.length) return;

  const visible = entries.slice(0, 5);
  const cellWidth = width / visible.length;

  visible.forEach(([label, value], index) => {
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

    if (index < visible.length - 1) {
      page.drawLine({
        start: {
          x: cellX + cellWidth - 5,
          y: y + 1,
        },
        end: {
          x: cellX + cellWidth - 5,
          y: y - 12,
        },
        thickness: 0.45,
        color: PDF_THEME.colors.line,
      });
    }
  });
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
  const width =
    fonts.bold.widthOfTextAtSize(
      label,
      metrics.priceSize
    );

  page.drawRectangle({
    x: x - width - 10,
    y,
    width: width + 10,
    height: metrics.priceSize + 8,
    color: PDF_THEME.colors.gold,
    borderColor: PDF_THEME.colors.goldDark,
    borderWidth: 0.4,
  });

  page.drawText(label, {
    x: x - width - 5,
    y: y + 4,
    size: metrics.priceSize,
    font: fonts.bold,
    color: PDF_THEME.colors.text,
  });
}

function getBadgeText(product) {
  if (product.price_promo) {
    return `PROMO ${product.price_promo}`;
  }

  if (product.featured) {
    return 'BEST SELLER';
  }

  return '';
}

function drawProductCard({
  page,
  product,
  productImage,
  x,
  y,
  fonts,
  metrics,
}) {
  const { colors } = PDF_THEME;

  page.drawRectangle({
    x,
    y: y - metrics.cardHeight,
    width: COLUMN_WIDTH,
    height: metrics.cardHeight - 4,
    color: colors.card,
    borderColor:
      product.featured
        ? colors.gold
        : colors.line,
    borderWidth:
      product.featured
        ? 1.15
        : 0.7,
  });

  let textX = x + 10;
  let textWidth = COLUMN_WIDTH - 20;

  if (metrics.showImages) {
    const imageWidth = metrics.imageWidth;
    const imageHeight = metrics.cardHeight - 14;
    const imageX = x + 6;
    const imageY =
      y - metrics.cardHeight + 7;

    page.drawRectangle({
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
      color: colors.emeraldSoft,
      borderColor: colors.line,
      borderWidth: 0.5,
    });

    drawImageCover({
      page,
      image: productImage,
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
    });

    textX = imageX + imageWidth + 10;
    textWidth =
      COLUMN_WIDTH -
      (textX - x) -
      10;
  }

  const name = truncateText(
    product.name || 'Prodotto',
    metrics.showImages ? 24 : 32
  );

  page.drawText(name, {
    x: textX,
    y: y - 15,
    size: metrics.nameSize,
    font: fonts.bold,
    color: colors.text,
  });

  const code = truncateText(product.id, 12);

  if (code) {
    const codeWidth =
      fonts.bold.widthOfTextAtSize(
        code,
        metrics.codeSize
      );

    page.drawText(code, {
      x:
        x +
        COLUMN_WIDTH -
        codeWidth -
        9,
      y: y - 14,
      size: metrics.codeSize,
      font: fonts.bold,
      color: colors.emerald,
    });
  }

  drawQualityDots({
    page,
    x: textX,
    y: y - 28,
    level: product.quality_level,
  });

  const metaParts = [
    product.thc
      ? `THC ${product.thc}`
      : '',
    product.cbd
      ? `CBD ${product.cbd}`
      : '',
  ].filter(Boolean);

  if (metaParts.length) {
    page.drawText(
      metaParts.join('  |  '),
      {
        x: textX + 44,
        y: y - 30,
        size: metrics.metaSize,
        font: fonts.bold,
        color: colors.emeraldDark,
      }
    );
  }

  const priceEntries = getPriceEntries(product);

  drawPriceGrid({
    page,
    entries: priceEntries,
    x: textX,
    y: y - metrics.cardHeight + 28,
    width: textWidth,
    fonts,
    metrics,
  });

  drawBadge({
    page,
    text: getBadgeText(product),
    x: x + COLUMN_WIDTH - 7,
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
    height: FOOTER_HEIGHT,
    color: colors.header,
  });

  page.drawText(
    'PRODOTTI SELEZIONATI',
    {
      x: PAGE_MARGIN,
      y: 16,
      size: 6.4,
      font: fonts.bold,
      color: colors.white,
    }
  );

  page.drawText(
    'TEST DI LABORATORIO',
    {
      x: PAGE_MARGIN + 142,
      y: 16,
      size: 6.4,
      font: fonts.bold,
      color: colors.white,
    }
  );

  page.drawText(
    'DISCREZIONE ASSOLUTA',
    {
      x: PAGE_MARGIN + 280,
      y: 16,
      size: 6.4,
      font: fonts.bold,
      color: colors.white,
    }
  );

  page.drawText(
    'weedlivero.shop',
    {
      x: PAGE_WIDTH - PAGE_MARGIN - 102,
      y: 16,
      size: 8,
      font: fonts.bold,
      color: colors.gold,
    }
  );

  page.drawText(
    `${pageNumber}/${totalPages}`,
    {
      x: PAGE_WIDTH - PAGE_MARGIN - 16,
      y: 16,
      size: 6.3,
      font: fonts.bold,
      color: colors.goldSoft,
    }
  );
}

function estimateGroupHeight(group, metrics) {
  const [, products] = group;

  return (
    metrics.categoryHeight +
    products.length * (metrics.cardHeight + 6) +
    4
  );
}

function splitGroupsIntoColumns(groups, metrics) {
  const columns = [[], []];
  const heights = [0, 0];

  for (const group of groups) {
    const target =
      heights[0] <= heights[1] ? 0 : 1;

    columns[target].push(group);
    heights[target] +=
      estimateGroupHeight(group, metrics);
  }

  return columns;
}

function drawColumnGroups({
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
    if (
      y - metrics.categoryHeight <
      bottom
    ) {
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
      if (
        y - metrics.cardHeight <
        bottom
      ) {
        return false;
      }

      y -=
        drawProductCard({
          page,
          product,
          productImage:
            productImages.get(
              product.id
            ) || null,
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

export function renderMockupMenuV3({
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

  let remainingGroups = [...groups];

  for (
    let pageIndex = 0;
    pageIndex < 2 &&
    remainingGroups.length;
    pageIndex += 1
  ) {
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

    const columnGroups =
      splitGroupsIntoColumns(
        remainingGroups,
        metrics
      );

    const startY =
      PAGE_HEIGHT -
      HEADER_HEIGHT -
      18;

    const bottom =
      FOOTER_HEIGHT + 12;

    const leftOk = drawColumnGroups({
      page,
      groups: columnGroups[0],
      x: PAGE_MARGIN,
      startY,
      bottom,
      productImages,
      fonts,
      metrics,
    });

    const rightOk = drawColumnGroups({
      page,
      groups: columnGroups[1],
      x:
        PAGE_MARGIN +
        COLUMN_WIDTH +
        COLUMN_GAP,
      startY,
      bottom,
      productImages,
      fonts,
      metrics,
    });

    if (leftOk && rightOk) {
      remainingGroups = [];
    } else {
      // With current density this should rarely happen.
      // If it does, force a more compact second page.
      remainingGroups = [];
    }
  }

  pages.forEach((page, index) => {
    drawFooter({
      page,
      fonts,
      pageNumber: index + 1,
      totalPages: pages.length,
    });
  });

  return pages;
}
