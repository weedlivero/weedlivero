import QRCode from 'qrcode';
import { readFile } from 'fs/promises';
import path from 'path';

import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  PDF_THEME,
} from '@/lib/pdf/theme';

import { formatDate } from '@/lib/pdf/utils';

export async function loadLogo(pdfDocument) {
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
      error instanceof Error
        ? error.message
        : error
    );

    return null;
  }
}

export async function loadQrCode(pdfDocument) {
  try {
    const dataUrl = await QRCode.toDataURL(
      'https://weedlivero.shop',
      {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 500,

        color: {
          dark: '#063B27',
          light: '#FFFFFF',
        },
      }
    );

    const bytes = Buffer.from(
      dataUrl.split(',')[1],
      'base64'
    );

    return await pdfDocument.embedPng(bytes);
  } catch (error) {
    console.warn(
      'QR code non inserito nel PDF:',
      error instanceof Error
        ? error.message
        : error
    );

    return null;
  }
}

export function drawHeader({
  page,
  logo,
  qrCode,
  density,
  fonts,
  productCount,
}) {
  const { colors, margin } = PDF_THEME;
  const { bold, regular, title } = fonts;

  const headerBottom =
    PAGE_HEIGHT - density.headerHeight;

  page.drawRectangle({
    x: 0,
    y: headerBottom,
    width: PAGE_WIDTH,
    height: density.headerHeight,
    color: colors.header,
  });

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 5,
    width: PAGE_WIDTH,
    height: 5,
    color: colors.gold,
  });

  page.drawLine({
    start: {
      x: 0,
      y: headerBottom,
    },

    end: {
      x: PAGE_WIDTH,
      y: headerBottom,
    },

    thickness: 1.2,
    color: colors.gold,
  });

  if (logo) {
    const maxWidth = 122;
    const maxHeight =
      density.headerHeight - 18;

    const scale = Math.min(
      maxWidth / logo.width,
      maxHeight / logo.height
    );

    const logoWidth =
      logo.width * scale;

    const logoHeight =
      logo.height * scale;

    page.drawImage(logo, {
      x: margin + 2,

      y:
        headerBottom +
        (density.headerHeight - logoHeight) / 2 -
        2,

      width: logoWidth,
      height: logoHeight,
    });
  } else {
    page.drawText('WEEDLIVERO', {
      x: margin + 4,
      y: PAGE_HEIGHT - 42,
      size: 18,
      font: bold,
      color: colors.white,
    });
  }

  const titleText = 'MENU PREMIUM';

  const titleSize =
    density.headerHeight <= 80
      ? 15
      : 18;

  const titleWidth =
    title.widthOfTextAtSize(
      titleText,
      titleSize
    );

  page.drawText(titleText, {
    x:
      PAGE_WIDTH / 2 -
      titleWidth / 2,

    y: PAGE_HEIGHT - 34,

    size: titleSize,
    font: title,
    color: colors.white,
  });

  page.drawLine({
    start: {
      x: PAGE_WIDTH / 2 - 28,
      y: PAGE_HEIGHT - 45,
    },

    end: {
      x: PAGE_WIDTH / 2 + 28,
      y: PAGE_HEIGHT - 45,
    },

    thickness: 1.6,
    color: colors.gold,
  });

  page.drawText(
    'QUALITA PREMIUM',
    {
      x: PAGE_WIDTH / 2 - 116,
      y: headerBottom + 14,
      size: 5.8,
      font: bold,
      color: colors.goldSoft,
    }
  );

  page.drawText('|', {
    x: PAGE_WIDTH / 2 - 45,
    y: headerBottom + 14,
    size: 5.8,
    font: regular,
    color: colors.gold,
  });

  page.drawText(
    'SELEZIONE CURATA',
    {
      x: PAGE_WIDTH / 2 - 37,
      y: headerBottom + 14,
      size: 5.8,
      font: bold,
      color: colors.goldSoft,
    }
  );

  page.drawText('|', {
    x: PAGE_WIDTH / 2 + 41,
    y: headerBottom + 14,
    size: 5.8,
    font: regular,
    color: colors.gold,
  });

  page.drawText(
    'DISCREZIONE',
    {
      x: PAGE_WIDTH / 2 + 49,
      y: headerBottom + 14,
      size: 5.8,
      font: bold,
      color: colors.goldSoft,
    }
  );

  const qrSize =
    density.headerHeight <= 80
      ? 35
      : 42;

  const qrX =
    PAGE_WIDTH -
    margin -
    qrSize;

  const qrY =
    headerBottom + 11;

  const infoX =
    qrX - 108;

  page.drawText(
    `Aggiornato: ${formatDate()}`,
    {
      x: infoX,
      y: PAGE_HEIGHT - 30,
      size: 6.4,
      font: bold,
      color: colors.white,
    }
  );

  page.drawText(
    `${productCount} ${
      productCount === 1
        ? 'prodotto attivo'
        : 'prodotti attivi'
    }`,
    {
      x: infoX,
      y: PAGE_HEIGHT - 44,
      size: 6.8,
      font: bold,
      color: colors.goldSoft,
    }
  );

  if (qrCode) {
    page.drawRectangle({
      x: qrX - 3,
      y: qrY - 3,
      width: qrSize + 6,
      height: qrSize + 6,
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
      x: qrX - 2,
      y: qrY - 10,
      size: 4.8,
      font: bold,
      color: colors.goldSoft,
    });
  }
}