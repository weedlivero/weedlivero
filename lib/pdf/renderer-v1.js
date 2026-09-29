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

const MARGIN = 24;
const GAP = 14;
const HEADER = 112;
const FOOTER = 38;
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN * 2 - GAP) / 2;

function metrics(count) {
  if (count <= 14) return {
    card: 70, image: 54, name: 10.8,
    meta: 7.1, price: 7.2, category: 24,
    showImages: true,
  };

  if (count <= 26) return {
    card: 56, image: 42, name: 9.2,
    meta: 6.2, price: 6.4, category: 21,
    showImages: true,
  };

  if (count <= 48) return {
    card: 39, image: 0, name: 8,
    meta: 5.5, price: 5.8, category: 18,
    showImages: false,
  };

  return {
    card: 31, image: 0, name: 7,
    meta: 5, price: 5.2, category: 16,
    showImages: false,
  };
}

function dots(page, x, y, level, colors) {
  const value = Math.min(5, Math.max(0, Number(level || 0)));

  for (let i = 0; i < 5; i += 1) {
    page.drawCircle({
      x: x + i * 7,
      y,
      size: 2.15,
      color: i < value ? colors.emerald : colors.white,
      borderColor: colors.emerald,
      borderWidth: 0.55,
    });
  }
}

function cover(page, image, x, y, size) {
  if (!image) return;

  const scale = Math.max(
    size / image.width,
    size / image.height
  );

  const width = image.width * scale;
  const height = image.height * scale;

  page.drawImage(image, {
    x: x + (size - width) / 2,
    y: y + (size - height) / 2,
    width,
    height,
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
  const { bold, title } = fonts;

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
      132 / logo.width,
      82 / logo.height
    );

    const width = logo.width * scale;
    const height = logo.height * scale;

    page.drawImage(logo, {
      x: MARGIN + 4,
      y: PAGE_HEIGHT - HEADER / 2 - height / 2 - 2,
      width,
      height,
    });
  }

  const titleText = 'MENU PREMIUM';
  const titleSize = 22;
  const titleWidth = title.widthOfTextAtSize(titleText, titleSize);

  page.drawText(titleText, {
    x: PAGE_WIDTH / 2 - titleWidth / 2,
    y: PAGE_HEIGHT - 43,
    size: titleSize,
    font: title,
    color: colors.white,
  });

  page.drawLine({
    start: { x: PAGE_WIDTH / 2 - 34, y: PAGE_HEIGHT - 53 },
    end: { x: PAGE_WIDTH / 2 + 34, y: PAGE_HEIGHT - 53 },
    thickness: 1.5,
    color: colors.gold,
  });

  page.drawText(
    'QUALITA PREMIUM  |  SELEZIONE CURATA  |  DISCREZIONE',
    {
      x: PAGE_WIDTH / 2 - 122,
      y: PAGE_HEIGHT - 86,
      size: 6.3,
      font: bold,
      color: colors.goldSoft,
    }
  );

  const qrSize = 48;
  const qrX = PAGE_WIDTH - MARGIN - qrSize;
  const qrY = PAGE_HEIGHT - HEADER + 18;

  page.drawText(`Aggiornato: ${updatedAt}`, {
    x: qrX - 118,
    y: PAGE_HEIGHT - 34,
    size: 6.5,
    font: bold,
    color: colors.white,
  });

  page.drawText(`${productCount} prodotti attivi`, {
    x: qrX - 118,
    y: PAGE_HEIGHT - 49,
    size: 6.8,
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
  }
}

function category(page, x, y, label, fonts, m) {
  const { colors } = PDF_THEME;
  const size = Math.max(8, m.name + 1.4);

  page.drawText(label, {
    x,
    y: y - 13,
    size,
    font: fonts.bold,
    color: colors.emeraldDark,
  });

  const labelWidth = fonts.bold.widthOfTextAtSize(label, size);

  page.drawLine({
    start: { x: x + labelWidth + 12, y: y - 10 },
    end: { x: x + COLUMN_WIDTH, y: y - 10 },
    thickness: 0.9,
    color: colors.gold,
  });

  return m.category;
}

function card({
  page,
  product,
  productImage,
  x,
  y,
  fonts,
  m,
}) {
  const { colors } = PDF_THEME;
  const { bold } = fonts;

  page.drawRectangle({
    x,
    y: y - m.card,
    width: COLUMN_WIDTH,
    height: m.card - 3,
    color: colors.card,
    borderColor: product.featured ? colors.gold : colors.line,
    borderWidth: product.featured ? 1.1 : 0.65,
  });

  let textX = x + 8;

  if (m.showImages) {
    const imageX = x + 5;
    const imageY = y - m.card + (m.card - m.image) / 2 - 1;

    page.drawRectangle({
      x: imageX,
      y: imageY,
      width: m.image,
      height: m.image,
      color: colors.emeraldSoft,
      borderColor: colors.line,
      borderWidth: 0.45,
    });

    cover(page, productImage, imageX, imageY, m.image);
    textX = imageX + m.image + 9;
  }

  const name = truncateText(
    product.name || 'Prodotto',
    m.showImages ? 24 : 30
  );
  const id = truncateText(product.id, 12);

  page.drawText(name, {
    x: textX,
    y: y - 14,
    size: m.name,
    font: bold,
    color: colors.text,
  });

  if (id) {
    const idWidth = bold.widthOfTextAtSize(id, m.meta);

    page.drawText(id, {
      x: x + COLUMN_WIDTH - idWidth - 8,
      y: y - 13,
      size: m.meta,
      font: bold,
      color: colors.emerald,
    });
  }

  dots(page, textX + 1, y - 28, product.quality_level, colors);

  const meta = buildMetaText(product);

  if (meta) {
    page.drawText(meta, {
      x: textX + 44,
      y: y - 30,
      size: m.meta,
      font: bold,
      color: colors.emeraldDark,
    });
  }

  const prices = buildPriceText(product);

  if (prices) {
    page.drawText(
      truncateText(prices, m.showImages ? 50 : 74),
      {
        x: textX,
        y: y - m.card + 10,
        size: m.price,
        font: bold,
        color: colors.text,
      }
    );
  }

  if (product.price_promo) {
    const promo = truncateText(
      `PROMO ${product.price_promo}`,
      22
    );

    const width = bold.widthOfTextAtSize(promo, m.price);

    page.drawRectangle({
      x: x + COLUMN_WIDTH - width - 15,
      y: y - m.card + 5,
      width: width + 10,
      height: m.price + 8,
      color: colors.gold,
      borderColor: colors.goldDark,
      borderWidth: 0.4,
    });

    page.drawText(promo, {
      x: x + COLUMN_WIDTH - width - 10,
      y: y - m.card + 9,
      size: m.price,
      font: bold,
      color: colors.text,
    });
  }

  return m.card;
}

function footer(page, fonts, pageNumber, totalPages) {
  const { colors } = PDF_THEME;

  page.drawLine({
    start: { x: MARGIN, y: 33 },
    end: { x: PAGE_WIDTH - MARGIN, y: 33 },
    thickness: 0.8,
    color: colors.gold,
  });

  page.drawText(
    'PRODOTTI SELEZIONATI  |  TEST DI LABORATORIO  |  DISCREZIONE ASSOLUTA',
    {
      x: MARGIN,
      y: 19,
      size: 6.2,
      font: fonts.regular,
      color: colors.emeraldDark,
    }
  );

  page.drawText('weedlivero.shop', {
    x: PAGE_WIDTH - MARGIN - 102,
    y: 19,
    size: 7.2,
    font: fonts.bold,
    color: colors.emeraldDark,
  });

  page.drawText(`${pageNumber}/${totalPages}`, {
    x: PAGE_WIDTH - MARGIN - 16,
    y: 19,
    size: 6.5,
    font: fonts.bold,
    color: colors.gray,
  });
}

function itemsFrom(groups) {
  const items = [];

  for (const [cat, products] of groups) {
    items.push({
      type: 'category',
      label: categoryLabel(cat),
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

export function renderPremiumMenu({
  pdfDocument,
  products,
  productImages,
  logo,
  qrCode,
  fonts,
  updatedAt,
}) {
  const m = metrics(products.length);
  const items = itemsFrom(groupProducts(products));
  const pages = [];

  let itemIndex = 0;

  for (
    let pageNumber = 1;
    pageNumber <= 2 && itemIndex < items.length;
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

    header({
      page,
      logo,
      qrCode,
      fonts,
      productCount: products.length,
      updatedAt,
    });

    for (
      let column = 0;
      column < 2 && itemIndex < items.length;
      column += 1
    ) {
      const x = MARGIN + column * (COLUMN_WIDTH + GAP);
      let y = PAGE_HEIGHT - HEADER - 18;
      const bottom = FOOTER + 10;

      while (itemIndex < items.length) {
        const item = items[itemIndex];

        if (item.type === 'category') {
          if (y - m.category < bottom) break;

          y -= category(
            page,
            x,
            y,
            item.label,
            fonts,
            m
          );

          itemIndex += 1;
          continue;
        }

        if (y - m.card < bottom) break;

        y -= card({
          page,
          product: item.product,
          productImage:
            productImages.get(item.product.id) || null,
          x,
          y,
          fonts,
          m,
        }) + 4;

        itemIndex += 1;
      }
    }
  }

  pages.forEach((page, index) => {
    footer(
      page,
      fonts,
      index + 1,
      pages.length
    );
  });

  return pages;
}
