import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  PDF_THEME,
} from '@/lib/pdf/theme';

import {
  buildMetaText,
  buildPriceText,
  categoryLabel,
  groupProducts,
  truncateText,
} from '@/lib/pdf/utils';

const PAGE_MARGIN = 24;
const COLUMN_GAP = 16;
const HEADER_HEIGHT = 118;
const FOOTER_HEIGHT = 44;
const COLUMN_WIDTH =
  (PAGE_WIDTH - PAGE_MARGIN * 2 - COLUMN_GAP) / 2;

function getMetrics(productCount) {
  if (productCount <= 10) {
    return {
      cardHeight: 118,
      imageSize: 86,
      nameSize: 12,
      codeSize: 7,
      metaSize: 7.2,
      priceSize: 7.4,
      categorySize: 12,
      categoryHeight: 27,
      showImages: true,
    };
  }

  if (productCount <= 18) {
    return {
      cardHeight: 92,
      imageSize: 66,
      nameSize: 10,
      codeSize: 6.4,
      metaSize: 6.4,
      priceSize: 6.6,
      categorySize: 10,
      categoryHeight: 23,
      showImages: true,
    };
  }

  if (productCount <= 32) {
    return {
      cardHeight: 62,
      imageSize: 44,
      nameSize: 8.8,
      codeSize: 5.8,
      metaSize: 5.8,
      priceSize: 6,
      categorySize: 9,
      categoryHeight: 20,
      showImages: true,
    };
  }

  return {
    cardHeight: 40,
    imageSize: 0,
    nameSize: 7.6,
    codeSize: 5.2,
    metaSize: 5.2,
    priceSize: 5.5,
    categorySize: 8.2,
    categoryHeight: 17,
    showImages: false,
  };
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
      86 / logo.height
    );

    const width = logo.width * scale;
    const height = logo.height * scale;

    page.drawImage(logo, {
      x: PAGE_MARGIN + 2,
      y:
        PAGE_HEIGHT -
        HEADER_HEIGHT / 2 -
        height / 2 -
        3,
      width,
      height,
    });
  }

  const titleText = 'MENU PREMIUM';
  const titleSize = 23;
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
      x: PAGE_WIDTH / 2 - 36,
      y: PAGE_HEIGHT - 54,
    },
    end: {
      x: PAGE_WIDTH / 2 + 36,
      y: PAGE_HEIGHT - 54,
    },
    thickness: 1.6,
    color: colors.gold,
  });

  page.drawText(
    'QUALITA PREMIUM  |  SELEZIONE CURATA  |  DISCREZIONE',
    {
      x: PAGE_WIDTH / 2 - 125,
      y: PAGE_HEIGHT - 88,
      size: 6.4,
      font: bold,
      color: colors.goldSoft,
    }
  );

  const qrSize = 50;
  const qrX =
    PAGE_WIDTH - PAGE_MARGIN - qrSize;
  const qrY =
    PAGE_HEIGHT - HEADER_HEIGHT + 22;

  page.drawText(`Aggiornato: ${updatedAt}`, {
    x: qrX - 120,
    y: PAGE_HEIGHT - 33,
    size: 6.5,
    font: bold,
    color: colors.white,
  });

  page.drawText(`${productCount} prodotti attivi`, {
    x: qrX - 120,
    y: PAGE_HEIGHT - 48,
    size: 6.9,
    font: bold,
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

    page.drawText('CATALOGO ONLINE', {
      x: qrX - 1,
      y: qrY - 13,
      size: 5.2,
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
    y: y - 14,
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
      x: x + labelWidth + 14,
      y: y - 10,
    },
    end: {
      x: x + COLUMN_WIDTH,
      y: y - 10,
    },
    thickness: 0.9,
    color: colors.gold,
  });

  return metrics.categoryHeight;
}

function drawQualityLeaves({
  page,
  x,
  y,
  level,
  fonts,
}) {
  const { colors } = PDF_THEME;

  const value = Math.min(
    5,
    Math.max(0, Number(level || 0))
  );

  const radius = 2.4;
  const gap = 7.5;

  for (let index = 0; index < 5; index += 1) {
    page.drawCircle({
      x: x + index * gap,
      y: y + 3,
      size: radius,

      color:
        index < value
          ? colors.emerald
          : colors.white,

      borderColor: colors.emerald,
      borderWidth: 0.6,
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
  product,
  x,
  y,
  width,
  fonts,
  metrics,
}) {
  const entries = [
    ['pz', product.price_unit],
    ['1g', product.price_1g],
    ['3g', product.price_3g],
    ['5g', product.price_5g],
    ['10g', product.price_10g],
    ['20g', product.price_20g],
    ['50g', product.price_50g],
    ['100g', product.price_100g],
  ].filter(([, value]) =>
    value !== null &&
    value !== undefined &&
    value !== ''
  );

  if (!entries.length) return;

  const maxItems = Math.min(entries.length, 5);
  const cellWidth = width / maxItems;

  entries.slice(0, maxItems).forEach(
    ([label, value], index) => {
      const cellX = x + index * cellWidth;

      page.drawText(label, {
        x: cellX,
        y,
        size: metrics.priceSize - 0.4,
        font: fonts.bold,
        color: PDF_THEME.colors.gray,
      });

      page.drawText(`${value} EUR`, {
        x: cellX,
        y: y - 10,
        size: metrics.priceSize,
        font: fonts.bold,
        color: PDF_THEME.colors.text,
      });

      if (index < maxItems - 1) {
        page.drawLine({
          start: {
            x: cellX + cellWidth - 5,
            y: y + 2,
          },
          end: {
            x: cellX + cellWidth - 5,
            y: y - 12,
          },
          thickness: 0.45,
          color: PDF_THEME.colors.line,
        });
      }
    }
  );
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
        ? 1.2
        : 0.7,
  });

  let textX = x + 10;
  let textWidth = COLUMN_WIDTH - 20;

  if (metrics.showImages) {
    const imageWidth = metrics.imageSize;
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
    y: y - 16,
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
      y: y - 15,
      size: metrics.codeSize,
      font: fonts.bold,
      color: colors.emerald,
    });
  }

  drawQualityLeaves({
    page,
    x: textX,
    y: y - 31,
    level: product.quality_level,
    fonts,
  });

  const meta = buildMetaText(product);

  if (meta) {
    page.drawText(meta, {
      x: textX + 58,
      y: y - 31,
      size: metrics.metaSize,
      font: fonts.bold,
      color: colors.emeraldDark,
    });
  }

  const priceY =
    y - metrics.cardHeight + 29;

  drawPriceGrid({
    page,
    product,
    x: textX,
    y: priceY,
    width: textWidth,
    fonts,
    metrics,
  });

  if (product.price_promo) {
    const promo = truncateText(
      `PROMO ${product.price_promo}`,
      22
    );

    const promoWidth =
      fonts.bold.widthOfTextAtSize(
        promo,
        metrics.priceSize
      );

    page.drawRectangle({
      x:
        x +
        COLUMN_WIDTH -
        promoWidth -
        17,
      y:
        y -
        metrics.cardHeight +
        7,
      width: promoWidth + 11,
      height: metrics.priceSize + 9,
      color: colors.gold,
      borderColor: colors.goldDark,
      borderWidth: 0.4,
    });

    page.drawText(promo, {
      x:
        x +
        COLUMN_WIDTH -
        promoWidth -
        11.5,
      y:
        y -
        metrics.cardHeight +
        11,
      size: metrics.priceSize,
      font: fonts.bold,
      color: colors.text,
    });
  }

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
      x: PAGE_MARGIN + 145,
      y: 16,
      size: 6.4,
      font: fonts.bold,
      color: colors.white,
    }
  );

  page.drawText(
    'DISCREZIONE ASSOLUTA',
    {
      x: PAGE_MARGIN + 285,
      y: 16,
      size: 6.4,
      font: fonts.bold,
      color: colors.white,
    }
  );

  page.drawText(
    'weedlivero.shop',
    {
      x: PAGE_WIDTH - PAGE_MARGIN - 100,
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

function makeItems(groups) {
  const items = [];

  for (const [category, products] of groups) {
    items.push({
      type: 'category',
      label: categoryLabel(category),
    });

    for (const product of products) {
      items.push({
        type: 'product',
        product,
      });
    }
  }

  return items;
}

export function renderMockupMenu({
  pdfDocument,
  products,
  productImages,
  logo,
  qrCode,
  fonts,
  updatedAt,
}) {
  const metrics = getMetrics(products.length);
  const items = makeItems(groupProducts(products));
  const pages = [];

  let itemIndex = 0;

  for (
    let pageNumber = 1;
    pageNumber <= 2 &&
    itemIndex < items.length;
    pageNumber += 1
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

    for (
      let column = 0;
      column < 2 &&
      itemIndex < items.length;
      column += 1
    ) {
      const x =
        PAGE_MARGIN +
        column *
          (COLUMN_WIDTH + COLUMN_GAP);

      let y =
        PAGE_HEIGHT -
        HEADER_HEIGHT -
        18;

      const bottom =
        FOOTER_HEIGHT + 12;

      while (itemIndex < items.length) {
        const item = items[itemIndex];

        if (item.type === 'category') {
          if (
            y -
              metrics.categoryHeight <
            bottom
          ) {
            break;
          }

          y -= drawCategoryHeader({
            page,
            x,
            y,
            label: item.label,
            fonts,
            metrics,
          });

          itemIndex += 1;
          continue;
        }

        if (
          y -
            metrics.cardHeight <
          bottom
        ) {
          break;
        }

        y -=
          drawProductCard({
            page,
            product: item.product,
            productImage:
              productImages.get(
                item.product.id
              ) || null,
            x,
            y,
            fonts,
            metrics,
          }) + 6;

        itemIndex += 1;
      }
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
