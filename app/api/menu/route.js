import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';

import { getProducts } from '@/lib/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 48;
const TOP_MARGIN = 55;
const BOTTOM_MARGIN = 55;

const COLORS = {
  green: rgb(0.02, 0.45, 0.29),
  darkGreen: rgb(0.02, 0.28, 0.19),
  gold: rgb(0.72, 0.52, 0.18),
  dark: rgb(0.08, 0.1, 0.12),
  gray: rgb(0.38, 0.42, 0.46),
  lightGray: rgb(0.91, 0.94, 0.92),
  white: rgb(1, 1, 1),
};

function cleanText(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function categoryLabel(category) {
  const labels = {
    weed: 'Flower',
    hash: 'Hash',
    concentrate: 'Concentrati',
    edibles: 'Edibles',
    vapes: 'Vapes',
  };

  return labels[category] || category || 'Altri prodotti';
}

function wrapText(text, font, fontSize, maxWidth) {
  const normalizedText = cleanText(text);

  if (!normalizedText) {
    return [];
  }

  const paragraphs = normalizedText.split('\n');
  const lines = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine
        ? `${currentLine} ${word}`
        : word;

      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }

        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function formatDate() {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Rome',
  }).format(new Date());
}

function groupProducts(products) {
  return products.reduce((groups, product) => {
    const category = product.category || 'other';

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(product);

    return groups;
  }, {});
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

export async function GET() {
  try {
    const products = await getProducts();

    const sortedProducts = [...products].sort((first, second) => {
      const categoryCompare = categoryLabel(
        first.category
      ).localeCompare(categoryLabel(second.category), 'it');

      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return String(first.name || '').localeCompare(
        String(second.name || ''),
        'it'
      );
    });

    const groupedProducts = groupProducts(sortedProducts);

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

    let page;
    let y;

    function addPage() {
      page = pdfDocument.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

      page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 15,
        width: PAGE_WIDTH,
        height: 15,
        color: COLORS.green,
      });

      y = PAGE_HEIGHT - TOP_MARGIN;

      return page;
    }

    function ensureSpace(requiredHeight) {
      if (y - requiredHeight < BOTTOM_MARGIN) {
        addPage();
        drawPageHeading();
      }
    }

    function drawPageHeading() {
      page.drawText('WEEDLIVERO', {
        x: MARGIN_X,
        y,
        size: 12,
        font: boldFont,
        color: COLORS.darkGreen,
      });

      page.drawText('Menu aggiornato', {
        x: PAGE_WIDTH - MARGIN_X - 105,
        y,
        size: 9,
        font: regularFont,
        color: COLORS.gray,
      });

      y -= 24;

      page.drawLine({
        start: {
          x: MARGIN_X,
          y,
        },
        end: {
          x: PAGE_WIDTH - MARGIN_X,
          y,
        },
        thickness: 1,
        color: COLORS.lightGray,
      });

      y -= 22;
    }

    addPage();

    if (logo) {
      const logoDimensions = logo.scale(0.12);

      const maxLogoWidth = 240;
      const scale =
        logoDimensions.width > maxLogoWidth
          ? maxLogoWidth / logoDimensions.width
          : 1;

      const logoWidth = logoDimensions.width * scale;
      const logoHeight = logoDimensions.height * scale;

      page.drawImage(logo, {
        x: (PAGE_WIDTH - logoWidth) / 2,
        y: PAGE_HEIGHT - 245,
        width: logoWidth,
        height: logoHeight,
      });

      y = PAGE_HEIGHT - 270;
    } else {
      page.drawText('WEEDLIVERO', {
        x: MARGIN_X,
        y: PAGE_HEIGHT - 125,
        size: 34,
        font: boldFont,
        color: COLORS.darkGreen,
      });

      y = PAGE_HEIGHT - 165;
    }

    page.drawText('MENU AGGIORNATO', {
      x: MARGIN_X,
      y,
      size: 22,
      font: boldFont,
      color: COLORS.dark,
    });

    y -= 28;

    page.drawText(`Generato il ${formatDate()}`, {
      x: MARGIN_X,
      y,
      size: 10,
      font: regularFont,
      color: COLORS.gray,
    });

    y -= 18;

    page.drawText(
      `${sortedProducts.length} ${
        sortedProducts.length === 1
          ? 'prodotto disponibile'
          : 'prodotti disponibili'
      }`,
      {
        x: MARGIN_X,
        y,
        size: 10,
        font: boldFont,
        color: COLORS.green,
      }
    );

    y -= 32;

    page.drawRectangle({
      x: MARGIN_X,
      y: y - 1,
      width: PAGE_WIDTH - MARGIN_X * 2,
      height: 2,
      color: COLORS.gold,
    });

    y -= 35;

    if (sortedProducts.length === 0) {
      page.drawText(
        'Al momento non ci sono prodotti attivi disponibili.',
        {
          x: MARGIN_X,
          y,
          size: 13,
          font: regularFont,
          color: COLORS.gray,
        }
      );
    } else {
      for (const [category, categoryProducts] of Object.entries(
        groupedProducts
      )) {
        ensureSpace(70);

        page.drawRectangle({
          x: MARGIN_X,
          y: y - 5,
          width: PAGE_WIDTH - MARGIN_X * 2,
          height: 28,
          color: COLORS.darkGreen,
        });

        page.drawText(categoryLabel(category).toUpperCase(), {
          x: MARGIN_X + 12,
          y: y + 4,
          size: 13,
          font: boldFont,
          color: COLORS.white,
        });

        y -= 42;

        for (const product of categoryProducts) {
          const name = cleanText(product.name) || 'Prodotto';
          const brand = cleanText(product.brand);
          const description = cleanText(product.description);
          const notes = cleanText(product.notes);
          const thc = cleanText(product.thc);
          const cbd = cleanText(product.cbd);
          const productId = cleanText(product.id);

          const descriptionLines = wrapText(
            description,
            regularFont,
            9.5,
            PAGE_WIDTH - MARGIN_X * 2
          ).slice(0, 6);

          const notesLines = wrapText(
            notes,
            regularFont,
            9.5,
            PAGE_WIDTH - MARGIN_X * 2 - 18
          ).slice(0, 8);

          let estimatedHeight = 54;

          estimatedHeight += descriptionLines.length * 13;

          if (notesLines.length > 0) {
            estimatedHeight += 28 + notesLines.length * 13;
          }

          ensureSpace(estimatedHeight);

          page.drawText(name, {
            x: MARGIN_X,
            y,
            size: 14,
            font: boldFont,
            color: COLORS.dark,
          });

          if (productId) {
            const idWidth = boldFont.widthOfTextAtSize(
              productId,
              8.5
            );

            page.drawText(productId, {
              x: PAGE_WIDTH - MARGIN_X - idWidth,
              y: y + 2,
              size: 8.5,
              font: boldFont,
              color: COLORS.green,
            });
          }

          y -= 17;

          const details = [
            brand ? `Brand: ${brand}` : '',
            thc ? `THC: ${thc}` : '',
            cbd ? `CBD: ${cbd}` : '',
          ].filter(Boolean);

          if (details.length > 0) {
            page.drawText(details.join('   •   '), {
              x: MARGIN_X,
              y,
              size: 9,
              font: boldFont,
              color: COLORS.green,
            });

            y -= 15;
          }

          for (const line of descriptionLines) {
            page.drawText(line, {
              x: MARGIN_X,
              y,
              size: 9.5,
              font: regularFont,
              color: COLORS.gray,
            });

            y -= 13;
          }

          if (notesLines.length > 0) {
            y -= 4;

            page.drawRectangle({
              x: MARGIN_X,
              y: y - notesLines.length * 13 - 12,
              width: PAGE_WIDTH - MARGIN_X * 2,
              height: notesLines.length * 13 + 18,
              color: rgb(0.95, 0.98, 0.96),
              borderColor: COLORS.lightGray,
              borderWidth: 1,
            });

            page.drawText('NOTE / PREZZI', {
              x: MARGIN_X + 10,
              y: y - 1,
              size: 8,
              font: boldFont,
              color: COLORS.darkGreen,
            });

            y -= 17;

            for (const line of notesLines) {
              page.drawText(line, {
                x: MARGIN_X + 10,
                y,
                size: 9.5,
                font: regularFont,
                color: COLORS.dark,
              });

              y -= 13;
            }

            y -= 8;
          }

          y -= 10;

          page.drawLine({
            start: {
              x: MARGIN_X,
              y,
            },
            end: {
              x: PAGE_WIDTH - MARGIN_X,
              y,
            },
            thickness: 0.7,
            color: COLORS.lightGray,
          });

          y -= 20;
        }

        y -= 8;
      }
    }

    const pages = pdfDocument.getPages();

    pages.forEach((currentPage, index) => {
      const pageNumber = `${index + 1} / ${pages.length}`;
      const pageNumberWidth = regularFont.widthOfTextAtSize(
        pageNumber,
        8
      );

      currentPage.drawText(
        'Menu generato automaticamente dai prodotti attivi',
        {
          x: MARGIN_X,
          y: 28,
          size: 8,
          font: regularFont,
          color: COLORS.gray,
        }
      );

      currentPage.drawText(pageNumber, {
        x: PAGE_WIDTH - MARGIN_X - pageNumberWidth,
        y: 28,
        size: 8,
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