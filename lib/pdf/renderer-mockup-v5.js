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

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
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

function getMetrics(count) {
  if (count <= 8) {
    return {
      baseCard: 112,
      imageWidth: 76,
      nameSize: 12,
      codeSize: 6.8,
      metaSize: 6.5,
      priceSize: 6.9,
      descriptionSize: 6.1,
      categorySize: 11,
      categoryHeight: 24,
      showImages: true,
      showDescriptions: true,
    };
  }

  if (count <= 16) {
    return {
      baseCard: 86,
      imageWidth: 58,
      nameSize: 10,
      codeSize: 6.1,
      metaSize: 6,
      priceSize: 6.2,
      descriptionSize: 5.5,
      categorySize: 9.6,
      categoryHeight: 21,
      showImages: true,
      showDescriptions: true,
    };
  }

  if (count <= 30) {
    return {
      baseCard: 64,
      imageWidth: 43,
      nameSize: 8.7,
      codeSize: 5.5,
      metaSize: 5.4,
      priceSize: 5.8,
      descriptionSize: 0,
      categorySize: 8.7,
      categoryHeight: 18,
      showImages: true,
      showDescriptions: false,
    };
  }

  return {
    baseCard: 44,
    imageWidth: 0,
    nameSize: 7.5,
    codeSize: 5,
    metaSize: 5,
    priceSize: 5.3,
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

  let height = metrics.baseCard;

  if (!image && metrics.showImages) height -= 18;
  if (!hasPrices) height -= 12;
  if (!hasMeta) height -= 8;
  if (!hasDescription) height -= 8;

  return Math.max(
    metrics.showImages ? 54 : 38,
    height
  );
}

function drawImageContain(page, image, x, y, width, height) {
  if (!image) return;

  const padding = 3;
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
    start: { x: x + labelWidth + 14, y: y - 9 },
    end: { x: x + COL_WIDTH, y: y - 9 },
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

function drawPill({
  page,
  text,
  x,
  y,
  fonts,
  metrics,
}) {
  if (!text) return 0;

  const paddingX = 5;
  const height = metrics.metaSize + 8;
  const width =
    fonts.bold.widthOfTextAtSize(text, metrics.metaSize) +
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

  page.drawText(text, {
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
  height,
}) {
  const { colors } = PDF_THEME;
  const imageVisible = Boolean(image) && metrics.showImages;

  page.drawRectangle({
    x,
    y: y - height,
    width: COL_WIDTH,
    height: height - 4,
    color: colors.card,
    borderColor: product.featured ? colors.gold : colors.line,
    borderWidth: product.featured ? 1.1 : 0.7,
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
    imageVisible ? 24 : 36
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

  let pillX = textX;
  const pillY = y - 50;

  if (product.thc) {
    pillX += drawPill({
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

  drawPriceGrid({
    page,
    product,
    x: textX,
    y: y - height + 31,
    width: usableWidth,
    fonts,
    metrics,
  });

  if (
    metrics.showDescriptions &&
    product.description
  ) {
    page.drawText(
      truncateText(product.description, 58),
      {
        x: textX,
        y: y - height + 14,
        size: metrics.descriptionSize,
        font: fonts.regular,
        color: colors.gray,
      }
    );
  }

  drawBadge({
    page,
    text: getBadge(product),
    x: x + COL_WIDTH - 7,
    y: y - height + 7,
    fonts,
    metrics,
  });

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

function buildItems(groups, productImages, metrics) {
  const items = [];

  for (const [category, products] of groups) {
    items.push({
      type: 'category',
      label: categoryLabel(category),
      height: metrics.categoryHeight,
    });

    for (const product of products) {
      items.push({
        type: 'product',
        product,
        height: cardHeight(product, productImages, metrics),
      });
    }
  }

  return items;
}

function renderPageColumns({
  page,
  items,
  startIndex,
  productImages,
  fonts,
  metrics,
}) {
  let index = startIndex;
  const startY = PAGE_HEIGHT - HEADER - 17;
  const bottom = FOOTER + 10;

  for (let column = 0; column < 2; column += 1) {
    const x = MARGIN + column * (COL_WIDTH + GAP);
    let y = startY;

    while (index < items.length) {
      const item = items[index];

      if (y - item.height < bottom) {
        break;
      }

      if (item.type === 'category') {
        y -= drawCategoryHeader({
          page,
          x,
          y,
          label: item.label,
          fonts,
          metrics,
        });

        index += 1;
        continue;
      }

      y -= drawCard({
        page,
        product: item.product,
        image: productImages.get(item.product.id) || null,
        x,
        y,
        fonts,
        metrics,
        height: item.height,
      }) + 6;

      index += 1;
    }
  }

  return index;
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
      firstColumn === 0 ? 1 : 0;

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

export function renderMockupV5({
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