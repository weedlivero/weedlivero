import { PDFDocument } from 'pdf-lib';

import { PDF_THEME } from '@/lib/pdf/theme';
import {
  loadLogo,
  loadQrCode,
} from '@/lib/pdf/header';
import { prepareProductImages } from '@/lib/pdf/media';
import { renderMockupV5 } from '@/lib/pdf/renderer-mockup-v5';
import { sortProducts } from '@/lib/pdf/utils';

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

export async function generateMenuPdf(productsInput) {
  const products = sortProducts(
    Array.isArray(productsInput)
      ? productsInput.filter(
          (product) => product.active !== false
        )
      : []
  );

  const pdfDocument = await PDFDocument.create();

  pdfDocument.setTitle('Menu Weedlivero');
  pdfDocument.setAuthor('Weedlivero');
  pdfDocument.setSubject(
    'Menu aggiornato dei prodotti attivi'
  );
  pdfDocument.setCreator('Weedlivero');
  pdfDocument.setProducer('Weedlivero');

  const regular = await pdfDocument.embedFont(
    PDF_THEME.fonts.regular
  );

  const bold = await pdfDocument.embedFont(
    PDF_THEME.fonts.bold
  );

  const title = await pdfDocument.embedFont(
    PDF_THEME.fonts.title
  );

  const fonts = {
    regular,
    bold,
    title,
  };

  const [logo, qrCode, productImages] =
    await Promise.all([
      loadLogo(pdfDocument),
      loadQrCode(pdfDocument),
      prepareProductImages(
        pdfDocument,
        products
      ),
    ]);

  renderMockupV5({
    pdfDocument,
    products,
    productImages,
    logo,
    qrCode,
    fonts,
    updatedAt: formatUpdatedAt(),
  });

  return pdfDocument.save();
}
