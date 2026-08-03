import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';

import { getProducts } from '@/lib/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 30;
const COLUMN_GAP = 14;
const COLUMN_WIDTH =
  (PAGE_WIDTH - MARGIN * 2 - COLUMN_GAP) / 2;

const COLORS = {
  emerald: rgb(0.02, 0.45, 0.29),
  emeraldDark: rgb(0.02, 0.26, 0.18),
  emeraldSoft: rgb(0.92, 0.98, 0.95),
  gold: rgb(0.78, 0.57, 0.16),
  goldSoft: rgb(0.99, 0.96, 0.84),
  ink: rgb(0.08, 0.1, 0.12),
  gray: rgb(0.42, 0.45, 0.49),
  line: rgb(0.86, 0.9, 0.87),
  white: rgb(1, 1, 1),
};

const CATEGORY_ORDER = [
  'weed',
  'hash',
  'concentrate',
  'edibles',
  'vapes',
  'other',
];

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text, maxLength) {
  const normalized = cleanText(text);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function categoryLabel(category) {
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

function formatDate() {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Rome',
  }).format(new Date());
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
}

function buildPriceText(product) {
  const prices = [
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
      return price ? `${label} ${price}€` : null;
    })
    .filter(Boolean);

  return prices.join('  ·  ');
}

function buildMetaText(product) {
  return [
    product.thc ? `THC ${cleanText(product.thc)}` : '',
    product.cbd ? `CBD ${cleanText(product.cbd)}` : '',
  ]
    .filter(Boolean)
    .join('  ·  ');
}

function buildStars(level) {
  const value = Math.min(5, Math.max(0, Number(level || 0)));

  if (!value) {
    return '';
  }

  return '★'.repeat(value) + '☆'.repeat(5 - value);
}

function groupProducts(products) {
  const groups = new Map();

  for (const product of products) {
    const category = product.category || 'other';

    if (!groups.has(category)) {
      groups.set(category, []);
    }

    groups.get(category).push(product);
  }

  return [...groups.entries()].sort(([first], [second]) => {
    const firstIndex = CATEGORY_ORDER.indexOf(first);
    const secondIndex = CATEGORY_ORDER.indexOf(second);

    return (
      (firstIndex === -1 ? 999 : firstIndex) -
      (secondIndex === -1 ? 999 : secondIndex)
    );
  });
}

async function loadLogo(pdfDocument) {
  try {
    const logoPath = path.join(
      process.cwd(),
      'public',
      'logo-weedlivero.png'
    );

    const logoBytes = await readFile(logoPath);

    return await pdfDocument.embedPng(logoBytes);
  } catch (error) {
    console.warn(
      'Logo non inserito nel PDF:',
      error instanceof Error ? error.message : error
    );

    return null;
  }
}

function getDensity(productCount) {
  if (productCount <= 36) {
    return {
      headerHeight: 108,
      categoryHeight: 22,
      rowHeight: 44,
      nameSize: 10.2,
      secondarySize: 7.3,
      priceSize: 7.5,
      maxNameLength: 32,
    };
  }

  if (productCount <= 64) {
    return {
      headerHeight: 96,
      categoryHeight: 19,
      rowHeight: 36,
      nameSize: 8.8,
      secondarySize: 6.6,
      priceSize: 6.8,
      maxNameLength: 28,
    };
  }

  if (productCount <= 92) {
    return {
      headerHeight: 88,
      categoryHeight: 17,
      rowHeight: 30,
      nameSize: 7.6,
      secondarySize: 5.9,
      priceSize: 6.1,
      maxNameLength: 24,
    };
  }

  return {
    headerHeight: 82,
    categoryHeight: 15,
    rowHeight: 25,
    nameSize: 6.7,
    secondarySize: 5.2,
    priceSize: 5.4,
    maxNameLength: 20,
  };
}

export async function GET() {
  try {
    const activeProducts = await getProducts();

    const products = [...activeProducts].sort((first, second) => {
      const firstOrder = Number(first.menu_order || 0);
      const secondOrder = Number(second.menu_order || 0);

      if (first.category !== second.category) {
        return categoryLabel(first.category).localeCompare(
          categoryLabel(second.category),
          'it'
        );
      }

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return cleanText(first.name).localeCompare(
        cleanText(second.name),
        'it'
      );
    });

    const groupedProducts = groupProducts(products);
    const density = getDensity(products.length);

    const pdfDocument = await PDFDocument.create();

    pdfDocument.setTitle('Menu Weedlivero');
    pdfDocument.setAuthor('Weedlivero');
    pdfDocument.setSubject('Menu aggiornato dei prodotti attivi');
    pdfDocument.setCreator('Weedlivero');
    pdfDocument.setProducer('Weedlivero');

    const regularFont = await pdfDocument.embedFont(
      StandardFonts.Helvetica
    );

    const boldFont = await pdfDocument.embedFont(
      StandardFonts.HelveticaBold
    );

    const logo = await loadLogo(pdfDocument);

    const pages = [];
    let pageIndex = 0;
    let columnIndex = 0;
    let y = 0;

    function drawHeader(page) {
      page.drawRectangle({
        x: MARGIN,
        y: PAGE_HEIGHT - density.headerHeight,
        width: PAGE_WIDTH - MARGIN * 2,
        height: density.headerHeight - 18,
        color: COLORS.emeraldSoft,
        borderColor: COLORS.line,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: MARGIN,
        y: PAGE_HEIGHT - density.headerHeight,
        width: 8,
        height: density.headerHeight - 18,
        color: COLORS.gold,
      });

      if (logo) {
        const maxWidth = 150;
        const maxHeight = 56;
        const scale = Math.min(
          maxWidth / logo.width,
          maxHeight / logo.height
        );

        const width = logo.width * scale;
        const height = logo.height * scale;

        page.drawImage(logo, {
          x: MARGIN + 20,
          y: PAGE_HEIGHT - 22 - height,
          width,
          height,
        });
      } else {
        page.drawText('WEEDLIVERO', {
          x: MARGIN + 20,
          y: PAGE_HEIGHT - 48,
          size: 22,
          font: boldFont,
          color: COLORS.emeraldDark,
        });
      }

      page.drawText('MENU SMART', {
        x: PAGE_WIDTH - MARGIN - 148,
        y: PAGE_HEIGHT - 45,
        size: 18,
        font: boldFont,
        color: COLORS.ink,
      });

      page.drawText(`Aggiornato: ${formatDate()}`, {
        x: PAGE_WIDTH - MARGIN - 148,
        y: PAGE_HEIGHT - 62,
        size: 7.5,
        font: regularFont,
        color: COLORS.gray,
      });

      page.drawText(
        `${products.length} ${
          products.length === 1
            ? 'prodotto attivo'
            : 'prodotti attivi'
        }`,
        {
          x: PAGE_WIDTH - MARGIN - 148,
          y: PAGE_HEIGHT - 76,
          size: 8,
          font: boldFont,
          color: COLORS.emerald,
        }
      );
    }

    function createPage() {
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
        color: COLORS.white,
      });

      page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 10,
        width: PAGE_WIDTH,
        height: 10,
        color: COLORS.emerald,
      });

      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: 8,
        color: COLORS.emeraldDark,
      });

      drawHeader(page);

      columnIndex = 0;
      y = PAGE_HEIGHT - density.headerHeight - 18;

      return page;
    }

    function currentPage() {
      return pages[pageIndex];
    }

    function currentColumnX() {
      return MARGIN + columnIndex * (COLUMN_WIDTH + COLUMN_GAP);
    }

    function moveToNextColumnOrPage() {
      if (columnIndex === 0) {
        columnIndex = 1;
        y = PAGE_HEIGHT - density.headerHeight - 18;
        return true;
      }

      if (pageIndex === 0) {
        pageIndex = 1;
        createPage();
        return true;
      }

      return false;
    }

    function ensureSpace(requiredHeight) {
      const bottomLimit = 42;

      if (y - requiredHeight >= bottomLimit) {
        return true;
      }

      return moveToNextColumnOrPage();
    }

    function drawCategoryHeader(label) {
      if (!ensureSpace(density.categoryHeight + 6)) {
        return false;
      }

      const page = currentPage();
      const x = currentColumnX();

      page.drawRectangle({
        x,
        y: y - density.categoryHeight + 3,
        width: COLUMN_WIDTH,
        height: density.categoryHeight,
        color: COLORS.emeraldDark,
      });

      page.drawRectangle({
        x,
        y: y - density.categoryHeight + 3,
        width: 7,
        height: density.categoryHeight,
        color: COLORS.gold,
      });

      page.drawText(label, {
        x: x + 12,
        y: y - density.categoryHeight + 8,
        size: Math.max(6.5, density.nameSize - 0.5),
        font: boldFont,
        color: COLORS.white,
      });

      y -= density.categoryHeight + 5;
      return true;
    }

    function drawProduct(product, index) {
      if (!ensureSpace(density.rowHeight)) {
        return false;
      }

      const page = currentPage();
      const x = currentColumnX();

      const background =
        index % 2 === 0
          ? COLORS.white
          : COLORS.emeraldSoft;

      page.drawRectangle({
        x,
        y: y - density.rowHeight + 2,
        width: COLUMN_WIDTH,
        height: density.rowHeight,
        color: background,
        borderColor: COLORS.line,
        borderWidth: 0.5,
      });

      const id = truncateText(product.id, 12);
      const name = truncateText(
        product.name || 'Prodotto',
        density.maxNameLength
      );

      const stars = buildStars(product.quality_level);
      const prices = buildPriceText(product);
      const meta = buildMetaText(product);
      const promo = truncateText(product.price_promo, 30);

      page.drawText(name, {
        x: x + 8,
        y: y - 10,
        size: density.nameSize,
        font: boldFont,
        color: COLORS.ink,
      });

      if (id) {
        const idWidth = boldFont.widthOfTextAtSize(
          id,
          density.secondarySize
        );

        page.drawText(id, {
          x: x + COLUMN_WIDTH - idWidth - 8,
          y: y - 9,
          size: density.secondarySize,
          font: boldFont,
          color: COLORS.emerald,
        });
      }

      const secondaryLine = [stars, meta]
        .filter(Boolean)
        .join('   ');

      if (secondaryLine) {
        page.drawText(secondaryLine, {
          x: x + 8,
          y: y - 21,
          size: density.secondarySize,
          font: regularFont,
          color: stars ? COLORS.gold : COLORS.gray,
        });
      }

      if (prices) {
        page.drawText(
          truncateText(prices, products.length > 80 ? 52 : 68),
          {
            x: x + 8,
            y: y - density.rowHeight + 8,
            size: density.priceSize,
            font: boldFont,
            color: COLORS.emeraldDark,
          }
        );
      }

      if (promo) {
        const promoWidth = boldFont.widthOfTextAtSize(
          promo,
          density.priceSize
        );

        page.drawRectangle({
          x: x + COLUMN_WIDTH - promoWidth - 14,
          y: y - density.rowHeight + 4,
          width: promoWidth + 10,
          height: density.priceSize + 7,
          color: COLORS.goldSoft,
          borderColor: COLORS.gold,
          borderWidth: 0.4,
        });

        page.drawText(promo, {
          x: x + COLUMN_WIDTH - promoWidth - 9,
          y: y - density.rowHeight + 8,
          size: density.priceSize,
          font: boldFont,
          color: COLORS.ink,
        });
      }

      y -= density.rowHeight + 2;
      return true;
    }

    createPage();

    if (products.length === 0) {
      const page = currentPage();

      page.drawText(
        'Al momento non ci sono prodotti attivi disponibili.',
        {
          x: MARGIN,
          y: PAGE_HEIGHT - density.headerHeight - 45,
          size: 13,
          font: regularFont,
          color: COLORS.gray,
        }
      );
    } else {
      let productIndex = 0;

      outer:
      for (const [category, categoryProducts] of groupedProducts) {
        if (!drawCategoryHeader(categoryLabel(category))) {
          break;
        }

        for (const product of categoryProducts) {
          if (!drawProduct(product, productIndex)) {
            break outer;
          }

          productIndex += 1;
        }

        y -= 4;
      }
    }

    const finalPages = pdfDocument.getPages();

    finalPages.forEach((page, index) => {
      const footer = `weedlivero.shop  ·  Menu generato automaticamente  ·  ${
        index + 1
      }/${finalPages.length}`;

      page.drawText(footer, {
        x: MARGIN,
        y: 20,
        size: 7,
        font: regularFont,
        color: COLORS.gray,
      });
    });

    const pdfBytes = await pdfDocument.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="menu-weedlivero.pdf"',
        'Cache-Control':
          'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('Errore generazione menu PDF:', error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore durante la generazione del menu PDF',
      },
      { status: 500 }
    );
  }
}