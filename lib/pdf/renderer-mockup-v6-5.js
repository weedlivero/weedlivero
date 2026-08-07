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
const MAX_PAGES = 2;
const COL_WIDTH = (PAGE_WIDTH - MARGIN * 2 - GAP) / 2;

const WIN_ANSI_REPLACEMENTS = new Map([
  ['\u2018', "'"],
  ['\u2019', "'"],
  ['\u201A', "'"],
  ['\u201B', "'"],
  ['\u201C', '"'],
  ['\u201D', '"'],
  ['\u201E', '"'],
  ['\u201F', '"'],
  ['\u2013', '-'],
  ['\u2014', '-'],
  ['\u2212', '-'],
  ['\u2026', '...'],
  ['\u2022', '-'],
  ['\u00A0', ' '],
  ['\u20AC', 'EUR'],
  ['\u2595', '|'],
]);

function pdfSafeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  const source = String(value).normalize('NFKD');
  let output = '';

  for (const char of source) {
    if (WIN_ANSI_REPLACEMENTS.has(char)) {
      output += WIN_ANSI_REPLACEMENTS.get(char);
      continue;
    }

    const code = char.codePointAt(0);

    // Helvetica/Times standard di pdf-lib usano WinAnsi.
    // Manteniamo ASCII + Latin-1; tutto il resto non deve
    // poter bloccare la generazione del PDF.
    if (
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code <= 126) ||
      (code >= 160 && code <= 255)
    ) {
      output += char;
    }
  }

  return output
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function safeTruncate(value, maxLength) {
  return truncateText(
    pdfSafeText(value),
    maxLength
  );
}


function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

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
      const formatted = formatPrice(value);
      return formatted ? [label, `${formatted} EUR`] : null;
    })
    .filter(Boolean);
}

function getBadge(product) {
  const pdfBadge = pdfSafeText(product.pdf_badge);

  if (pdfBadge) return pdfBadge;
  if (product.price_promo) return pdfSafeText(`PROMO ${product.price_promo}`);
  if (product.featured) return 'BEST SELLER';

  return '';
}

function getMetrics(count) {
  if (count <= 8) {
    return {
      baseCard: 142,
      imageWidth: 86,
      nameSize: 12.2,
      codeSize: 6.9,
      metaSize: 6.7,
      priceSize: 7.1,
      descriptionSize: 6.3,
      categorySize: 11.2,
      categoryHeight: 25,
      showImages: true,
      showDescriptions: true,
    };
  }

  if (count <= 16) {
    return {
      baseCard: 90,
      imageWidth: 60,
      nameSize: 9.8,
      codeSize: 6,
      metaSize: 5.9,
      priceSize: 6.1,
      descriptionSize: 5.4,
      categorySize: 9.4,
      categoryHeight: 20,
      showImages: true,
      showDescriptions: true,
    };
  }

  if (count <= 30) {
    return {
      baseCard: 66,
      imageWidth: 44,
      nameSize: 8.5,
      codeSize: 5.4,
      metaSize: 5.3,
      priceSize: 5.7,
      descriptionSize: 0,
      categorySize: 8.5,
      categoryHeight: 18,
      showImages: true,
      showDescriptions: false,
    };
  }

  return {
    baseCard: 44,
    imageWidth: 0,
    nameSize: 7.4,
    codeSize: 5,
    metaSize: 4.9,
    priceSize: 5.2,
    descriptionSize: 0,
    categorySize: 8,
    categoryHeight: 16,
    showImages: false,
    showDescriptions: false,
  };
}

function hasImage(product, productImages) {
  return Boolean(productImages.get(product.id));
}

function cardHeight(product, productImages, metrics) {
  const image = hasImage(product, productImages);
  const hasPrices = getPrices(product).length > 0;
  const hasMeta = Boolean(product.thc || product.cbd);
  const hasDescription =
    metrics.showDescriptions &&
    Boolean(String(product.description || '').trim());
  const hasBadge = Boolean(getBadge(product));

  let height = metrics.baseCard;

  // Card senza contenuti: più compatte.
  if (!image && metrics.showImages) height -= 14;
  if (!hasPrices) height -= 12;
  if (!hasMeta) height -= 7;
  if (!hasDescription) height -= 7;

  // Se c'è un badge, riserviamo una fascia reale in basso.
  if (hasBadge) height += 12;

  return Math.max(
    metrics.showImages ? 54 : 38,
    height
  );
}

function drawImageContain(page, image, x, y, width, height) {
  if (!image) return;

  const padding = 5;
  const availableWidth = Math.max(1, width - padding * 2);
  const availableHeight = Math.max(1, height - padding * 2);

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
    start: { x: PAGE_WIDTH / 2 - 34, y: PAGE_HEIGHT - 54 },
    end: { x: PAGE_WIDTH / 2 + 34, y: PAGE_HEIGHT - 54 },
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

  page.drawText(pdfSafeText(`Aggiornato: ${updatedAt}`), {
    x: qrX - 122,
    y: PAGE_HEIGHT - 33,
    size: 6.5,
    font: fonts.bold,
    color: colors.white,
  });

  page.drawText(
    `${productCount} ${
      productCount === 1
        ? 'prodotto attivo'
        : 'prodotti attivi'
    }`,
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
  const safeLabel = pdfSafeText(label);
  const lineY = y - 9;

  page.drawLine({
    start: { x, y: lineY },
    end: { x: x + 16, y: lineY },
    thickness: 1.1,
    color: colors.gold,
  });

  page.drawText(safeLabel, {
    x: x + 22,
    y: y - 13,
    size: metrics.categorySize,
    font: fonts.bold,
    color: colors.emeraldDark,
  });

  const labelWidth =
    fonts.bold.widthOfTextAtSize(
      safeLabel,
      metrics.categorySize
    );

  page.drawLine({
    start: {
      x: x + 22 + labelWidth + 12,
      y: lineY,
    },
    end: {
      x: x + COL_WIDTH,
      y: lineY,
    },
    thickness: 1.1,
    color: colors.gold,
  });

  return metrics.categoryHeight;
}

function drawQualityDots(page, x, y, level) {
  const { colors } = PDF_THEME;
  const value = Math.min(
    5,
    Math.max(0, Number(level || 0))
  );

  for (let i = 0; i < 5; i += 1) {
    page.drawCircle({
      x: x + i * 8,
      y,
      size: 2.5,
      color:
        i < value
          ? colors.emerald
          : colors.white,
      borderColor: colors.emerald,
      borderWidth: 0.6,
    });
  }
}

function drawPill({
  page,
  text,
  x,
  y,
  fonts,
  metrics,
}) {
  const safeText = pdfSafeText(text);
  if (!safeText) return 0;

  const paddingX = 5;
  const height = metrics.metaSize + 8;
  const width =
    fonts.bold.widthOfTextAtSize(
      safeText,
      metrics.metaSize
    ) +
    paddingX * 2;

  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: PDF_THEME.colors.white,
    borderColor: PDF_THEME.colors.line,
    borderWidth: 0.6,
  });

  page.drawText(safeText, {
    x: x + paddingX,
    y: y + 4,
    size: metrics.metaSize,
    font: fonts.bold,
    color: PDF_THEME.colors.emeraldDark,
  });

  return width;
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

    page.drawRectangle({
      x: cellX,
      y: y - 13,
      width: Math.max(20, cellWidth - 4),
      height: 24,
      color: PDF_THEME.colors.emeraldSoft,
      borderColor: PDF_THEME.colors.line,
      borderWidth: 0.35,
    });

    page.drawText(label, {
      x: cellX + 4,
      y: y + 1,
      size: metrics.priceSize - 0.6,
      font: fonts.bold,
      color: PDF_THEME.colors.gray,
    });

    page.drawText(value, {
      x: cellX + 4,
      y: y - 9,
      size: metrics.priceSize,
      font: fonts.bold,
      color: PDF_THEME.colors.text,
    });
  });
}

function badgeColors(text) {
  const normalized = String(text || '').toUpperCase();

  if (normalized === 'NEW') {
    return {
      fill: PDF_THEME.colors.emerald,
      border: PDF_THEME.colors.emeraldDark,
      text: PDF_THEME.colors.white,
    };
  }

  if (normalized === 'LIMITED') {
    return {
      fill: PDF_THEME.colors.goldDark,
      border: PDF_THEME.colors.gold,
      text: PDF_THEME.colors.white,
    };
  }

  if (normalized === 'PREMIUM') {
    return {
      fill: PDF_THEME.colors.header,
      border: PDF_THEME.colors.gold,
      text: PDF_THEME.colors.goldSoft,
    };
  }

  return {
    fill: PDF_THEME.colors.gold,
    border: PDF_THEME.colors.goldDark,
    text: PDF_THEME.colors.white,
  };
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

  const label = safeTruncate(
    pdfSafeText(text).toUpperCase(),
    18
  );

  const fontSize = Math.max(
    5.6,
    metrics.priceSize
  );

  const paddingX = 7;
  const badgeHeight = fontSize + 9;

  const textWidth =
    fonts.bold.widthOfTextAtSize(
      label,
      fontSize
    );

  const badgeWidth =
    textWidth + paddingX * 2;

  const colors = badgeColors(label);

  page.drawRectangle({
    x: x - badgeWidth,
    y,
    width: badgeWidth,
    height: badgeHeight,
    color: colors.fill,
    borderColor: colors.border,
    borderWidth: 0.7,
  });

  page.drawText(label, {
    x:
      x -
      badgeWidth +
      paddingX,
    y: y + 4.5,
    size: fontSize,
    font: fonts.bold,
    color: colors.text,
  });
}

function fitNameLines(text, font, size, maxWidth) {
  const normalized = pdfSafeText(text || 'Prodotto') || 'Prodotto';
  const words = normalized.split(/\s+/).filter(Boolean);

  if (!words.length) {
    return ['Prodotto'];
  }

  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current
      ? `${current} ${word}`
      : word;

    if (
      font.widthOfTextAtSize(candidate, size) <= maxWidth
    ) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;

    if (lines.length === 1) {
      break;
    }
  }

  if (lines.length < 2 && current) {
    lines.push(current);
  }

  if (
    lines.length === 2 &&
    font.widthOfTextAtSize(lines[1], size) > maxWidth
  ) {
    let shortened = lines[1];

    while (
      shortened.length > 1 &&
      font.widthOfTextAtSize(
        `${shortened}...`,
        size
      ) > maxWidth
    ) {
      shortened = shortened.slice(0, -1);
    }

    lines[1] = `${shortened}...`;
  }

  return lines.slice(0, 2);
}

function drawCard({
  page,
  product,
  image,
  x,
  y,
  fonts,
  metrics,
  height,
}) {
  const { colors } = PDF_THEME;
  const imageVisible =
    Boolean(image) &&
    metrics.showImages;

  const badgeText = getBadge(product);
  const hasBadge = Boolean(badgeText);
  const prices = getPrices(product);
  const hasPrices = prices.length > 0;
  const hasDescription =
    metrics.showDescriptions &&
    Boolean(String(product.description || '').trim());

  page.drawRectangle({
    x: x + 2,
    y: y - height - 2,
    width: COL_WIDTH,
    height: height - 4,
    color: colors.line,
    opacity: 0.15,
  });

  page.drawRectangle({
    x,
    y: y - height,
    width: COL_WIDTH,
    height: height - 4,
    color: colors.card,
    borderColor:
      product.featured
        ? colors.gold
        : colors.line,
    borderWidth:
      product.featured
        ? 1.1
        : 0.7,
  });

  let textX = x + 10;
  let usableWidth = COL_WIDTH - 20;

  if (imageVisible) {
    const imageX = x + 6;
    const imageY = y - height + 7;
    const imageHeight = height - 14;

    page.drawRectangle({
      x: imageX,
      y: imageY,
      width: metrics.imageWidth,
      height: imageHeight,
      color: colors.emeraldSoft,
      borderColor: colors.gold,
      borderWidth: 0.65,
    });

    drawImageContain(
      page,
      image,
      imageX,
      imageY,
      metrics.imageWidth,
      imageHeight
    );

    textX =
      imageX +
      metrics.imageWidth +
      10;

    usableWidth =
      COL_WIDTH -
      (textX - x) -
      10;
  }

  const code = safeTruncate(product.id, 12);
  let codeWidth = 0;

  if (code) {
    codeWidth =
      fonts.bold.widthOfTextAtSize(
        code,
        metrics.codeSize
      );
  }

  const maxNameWidth =
    Math.max(
      60,
      x + COL_WIDTH - 12 - codeWidth - 10 - textX
    );

  const nameLines = fitNameLines(
    product.name || 'Prodotto',
    fonts.bold,
    metrics.nameSize,
    maxNameWidth
  );

  nameLines.forEach((line, index) => {
    page.drawText(line, {
      x: textX,
      y: y - 16 - index * (metrics.nameSize + 2),
      size: metrics.nameSize,
      font: fonts.bold,
      color: colors.text,
    });
  });

  if (code) {
    page.drawText(code, {
      x:
        x +
        COL_WIDTH -
        codeWidth -
        9,
      y: y - 15,
      size: metrics.codeSize,
      font: fonts.bold,
      color: colors.emerald,
    });
  }

  const contentShift =
    nameLines.length > 1
      ? metrics.nameSize + 2
      : 0;

  drawQualityDots(
    page,
    textX,
    y - 31 - contentShift,
    product.quality_level
  );

  let pillX = textX;
  const pillY =
    y - 50 - contentShift;

  if (product.thc) {
    pillX +=
      drawPill({
        page,
        text: `THC ${product.thc}`,
        x: pillX,
        y: pillY,
        fonts,
        metrics,
      }) + 6;
  }

  if (product.cbd) {
    drawPill({
      page,
      text: `CBD ${product.cbd}`,
      x: pillX,
      y: pillY,
      fonts,
      metrics,
    });
  }

  // Fascia inferiore: badge in fondo, descrizione sopra, prezzi ancora sopra.
  const badgeY = y - height + 8;
  const badgeBand = hasBadge ? 22 : 0;
  const descriptionY =
    y - height + 14 + badgeBand;
  const descriptionBand =
    hasDescription ? 16 : 0;
  const priceY =
    y - height + 33 + badgeBand + descriptionBand;

  if (hasPrices) {
    drawPriceGrid({
      page,
      product,
      x: textX,
      y: priceY,
      width: usableWidth,
      fonts,
      metrics,
    });
  }

  if (hasDescription) {
    page.drawText(
      safeTruncate(product.description, 58),
      {
        x: textX,
        y: descriptionY,
        size: metrics.descriptionSize,
        font: fonts.regular,
        color: colors.gray,
      }
    );
  }

  if (hasBadge) {
    drawBadge({
      page,
      text: badgeText,
      x: x + COL_WIDTH - 8,
      y: badgeY,
      fonts,
      metrics,
    });
  }

  return height;
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
    x:
      PAGE_WIDTH -
      MARGIN -
      102,
    y: 16,
    size: 8,
    font: fonts.bold,
    color: colors.gold,
  });

  page.drawText(
    `${pageNumber}/${totalPages}`,
    {
      x:
        PAGE_WIDTH -
        MARGIN -
        16,
      y: 16,
      size: 6.2,
      font: fonts.bold,
      color: colors.goldSoft,
    }
  );
}

function prepareGroups(products, productImages, metrics) {
  return groupProducts(products).map(
    ([category, categoryProducts]) => {
      const items = categoryProducts.map((product) => ({
        product,
        height: cardHeight(
          product,
          productImages,
          metrics
        ),
      }));

      const totalHeight =
        metrics.categoryHeight +
        items.reduce(
          (total, item) =>
            total + item.height + 6,
          0
        ) +
        4;

      return {
        category,
        label: categoryLabel(category),
        items,
        totalHeight,
      };
    }
  );
}

function createPagePlan(groups) {
  const availableHeight =
    PAGE_HEIGHT -
    HEADER -
    FOOTER -
    27;

  const totalHeight = groups.reduce(
    (sum, group) => sum + group.totalHeight,
    0
  );

  const allFitOnOnePage =
    groups.every(
      (group) =>
        group.totalHeight <= availableHeight
    ) &&
    totalHeight <= availableHeight * 2;

  if (allFitOnOnePage) {
    const indexedGroups = groups.map(
      (group, index) => ({
        ...group,
        originalIndex: index,
      })
    );

    const sorted = [...indexedGroups].sort(
      (a, b) =>
        b.totalHeight - a.totalHeight
    );

    const columns = [[], []];
    const heights = [0, 0];

    for (const group of sorted) {
      const target =
        heights[0] <= heights[1]
          ? 0
          : 1;

      columns[target].push(group);
      heights[target] += group.totalHeight;
    }

    // Mantiene l'ordine naturale delle categorie
    // dentro ogni colonna, come nel mockup.
    columns[0].sort(
      (a, b) =>
        a.originalIndex - b.originalIndex
    );

    columns[1].sort(
      (a, b) =>
        a.originalIndex - b.originalIndex
    );

    return [
      {
        columns,
        heights,
      },
    ];
  }

  // Fallback multipagina: mantiene le categorie intere.
  const pages = [];

  let currentPage = {
    columns: [[], []],
    heights: [0, 0],
  };

  for (const group of groups) {
    const firstColumn =
      currentPage.heights[0] <=
      currentPage.heights[1]
        ? 0
        : 1;

    const secondColumn =
      firstColumn === 0
        ? 1
        : 0;

    if (
      currentPage.heights[firstColumn] +
        group.totalHeight <=
      availableHeight
    ) {
      currentPage.columns[firstColumn].push(group);

      currentPage.heights[firstColumn] +=
        group.totalHeight;

      continue;
    }

    if (
      currentPage.heights[secondColumn] +
        group.totalHeight <=
      availableHeight
    ) {
      currentPage.columns[secondColumn].push(group);

      currentPage.heights[secondColumn] +=
        group.totalHeight;

      continue;
    }

    pages.push(currentPage);

    if (pages.length >= MAX_PAGES) {
      break;
    }

    currentPage = {
      columns: [[group], []],
      heights: [group.totalHeight, 0],
    };
  }

  const currentPageHasContent =
    currentPage.columns[0].length > 0 ||
    currentPage.columns[1].length > 0;

  if (
    currentPageHasContent &&
    pages.length < MAX_PAGES
  ) {
    pages.push(currentPage);
  }

  return pages;
}

function drawGroupColumn({
  page,
  groups,
  x,
  productImages,
  fonts,
  metrics,
}) {
  let y =
    PAGE_HEIGHT -
    HEADER -
    17;

  for (const group of groups) {
    y -= drawCategoryHeader({
      page,
      x,
      y,
      label: group.label,
      fonts,
      metrics,
    });

    for (const item of group.items) {
      y -=
        drawCard({
          page,
          product: item.product,
          image:
            productImages.get(
              item.product.id
            ) || null,
          x,
          y,
          fonts,
          metrics,
          height: item.height,
        }) + 6;
    }

    y -= 4;
  }
}

export function renderMockupV65({
  pdfDocument,
  products,
  productImages,
  logo,
  qrCode,
  fonts,
  updatedAt,
}) {
  const metrics =
    getMetrics(products.length);

  const groups = prepareGroups(
    products,
    productImages,
    metrics
  );

  const pagePlans =
    createPagePlan(groups);

  const pages = [];

  if (pagePlans.length === 0) {
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
      color:
        PDF_THEME.colors.background,
    });

    drawHeader({
      page,
      logo,
      qrCode,
      fonts,
      productCount: 0,
      updatedAt,
    });

    page.drawText(
      'Al momento non ci sono prodotti attivi.',
      {
        x: MARGIN,
        y:
          PAGE_HEIGHT -
          HEADER -
          40,
        size: 12,
        font: fonts.regular,
        color:
          PDF_THEME.colors.gray,
      }
    );
  } else {
    for (const plan of pagePlans) {
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
        color:
          PDF_THEME.colors.background,
      });

      drawHeader({
        page,
        logo,
        qrCode,
        fonts,
        productCount:
          products.length,
        updatedAt,
      });

      drawGroupColumn({
        page,
        groups: plan.columns[0],
        x: MARGIN,
        productImages,
        fonts,
        metrics,
      });

      drawGroupColumn({
        page,
        groups: plan.columns[1],
        x:
          MARGIN +
          COL_WIDTH +
          GAP,
        productImages,
        fonts,
        metrics,
      });
    }
  }

  pages.forEach(
    (page, pageIndex) => {
      drawFooter({
        page,
        fonts,
        pageNumber:
          pageIndex + 1,
        totalPages:
          pages.length,
      });
    }
  );

  return pages;
}
