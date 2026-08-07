import {
  PDFDocument,
  PDFPage,
} from 'pdf-lib';

import { PDF_THEME } from '@/lib/pdf/theme';
import {
  loadLogo,
  loadQrCode,
} from '@/lib/pdf/header';
import { prepareProductImages } from '@/lib/pdf/media';
import { renderMockupV65 } from '@/lib/pdf/renderer-mockup-v6-5';
import { sortProducts } from '@/lib/pdf/utils';

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
  ['\u2605', '*'],
  ['\u2606', '*'],
  ['\u2B50', '*'],
]);

function pdfSafeString(value) {
  const source = String(value ?? '').normalize('NFKD');
  let output = '';

  for (const char of source) {
    if (WIN_ANSI_REPLACEMENTS.has(char)) {
      output += WIN_ANSI_REPLACEMENTS.get(char);
      continue;
    }

    const code = char.codePointAt(0);

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

  return output;
}

function sanitizePdfValue(value) {
  if (typeof value === 'string') {
    return pdfSafeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizePdfValue);
  }

  if (
    value &&
    typeof value === 'object' &&
    !(value instanceof Date)
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, item]) => [
          key,
          sanitizePdfValue(item),
        ]
      )
    );
  }

  return value;
}

function sanitizeProductsForPdf(products) {
  return products.map((product) =>
    sanitizePdfValue(product)
  );
}

function installGlobalPdfTextSanitizer() {
  if (
    PDFPage.prototype.__weedliveroSafeDrawText
  ) {
    return;
  }

  const originalDrawText =
    PDFPage.prototype.drawText;

  PDFPage.prototype.drawText = function (
    text,
    options
  ) {
    return originalDrawText.call(
      this,
      pdfSafeString(text),
      options
    );
  };

  Object.defineProperty(
    PDFPage.prototype,
    '__weedliveroSafeDrawText',
    {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false,
    }
  );
}

function formatUpdatedAt() {
  return new Intl.DateTimeFormat(
    'it-IT',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Rome',
    }
  ).format(new Date());
}

export async function generateMenuPdf(
  productsInput
) {
  installGlobalPdfTextSanitizer();

  const rawProducts =
    Array.isArray(productsInput)
      ? productsInput.filter(
          (product) =>
            product.active !== false
        )
      : [];

  const products = sortProducts(
    sanitizeProductsForPdf(rawProducts)
  );

  const pdfDocument =
    await PDFDocument.create();

  pdfDocument.setTitle('Menu Weedlivero');
  pdfDocument.setAuthor('Weedlivero');
  pdfDocument.setSubject(
    'Menu aggiornato dei prodotti attivi'
  );
  pdfDocument.setCreator('Weedlivero');
  pdfDocument.setProducer('Weedlivero');

  const regular =
    await pdfDocument.embedFont(
      PDF_THEME.fonts.regular
    );

  const bold =
    await pdfDocument.embedFont(
      PDF_THEME.fonts.bold
    );

  const title =
    await pdfDocument.embedFont(
      PDF_THEME.fonts.title
    );

  const fonts = {
    regular,
    bold,
    title,
  };

  const [
    logo,
    qrCode,
    productImages,
  ] = await Promise.all([
    loadLogo(pdfDocument),
    loadQrCode(pdfDocument),
    prepareProductImages(
      pdfDocument,
      products
    ),
  ]);

  renderMockupV65({
    pdfDocument,
    products,
    productImages,
    logo,
    qrCode,
    fonts,
    updatedAt:
      formatUpdatedAt(),
  });

  return pdfDocument.save();
}