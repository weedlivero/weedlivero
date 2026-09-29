import { PAGE_HEIGHT, PAGE_WIDTH, PDF_THEME, getColumnWidth } from '@/lib/pdf/theme';
import { drawHeader } from '@/lib/pdf/header';

export function createLayoutEngine({ pdfDocument, density, fonts, logo, qrCode, productCount }) {
  const { colors, margin, columnGap, maxPages } = PDF_THEME;
  const columnWidth = getColumnWidth();
  const pages = [];
  let pageIndex = 0;
  let columnIndex = 0;
  let y = 0;

  function createPage() {
    const page = pdfDocument.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: colors.cream });
    drawHeader({ page, logo, qrCode, density, fonts, productCount });
    columnIndex = 0;
    y = PAGE_HEIGHT - density.headerHeight - 14;
    return page;
  }

  function currentPage() { return pages[pageIndex]; }
  function currentColumnX() { return margin + columnIndex * (columnWidth + columnGap); }

  function moveToNextColumnOrPage() {
    if (columnIndex === 0) {
      columnIndex = 1;
      y = PAGE_HEIGHT - density.headerHeight - 14;
      return true;
    }
    if (pageIndex + 1 < maxPages) {
      pageIndex += 1;
      createPage();
      return true;
    }
    return false;
  }

  function ensureSpace(requiredHeight) {
    if (y - requiredHeight >= 50) return true;
    return moveToNextColumnOrPage();
  }

  function getPosition() {
    return { page: currentPage(), x: currentColumnX(), y, columnWidth };
  }

  function consume(height) { y -= height; }
  function addGap(height) { y -= height; }

  function drawFooter() {
    const finalPages = pdfDocument.getPages();
    const { bold, regular } = fonts;

    finalPages.forEach((page, index) => {
      page.drawLine({
        start: { x: margin, y: 34 },
        end: { x: PAGE_WIDTH - margin, y: 34 },
        thickness: 0.7,
        color: colors.gold,
      });

      page.drawText('PRODOTTI SELEZIONATI   |   QUALITA PREMIUM   |   DISCREZIONE ASSOLUTA', {
        x: margin,
        y: 19,
        size: 6.2,
        font: regular,
        color: colors.emeraldDark,
      });

      const site = 'weedlivero.shop';
      const siteWidth = bold.widthOfTextAtSize(site, 7.2);
      page.drawText(site, {
        x: PAGE_WIDTH / 2 - siteWidth / 2,
        y: 18,
        size: 7.2,
        font: bold,
        color: colors.emeraldDark,
      });

      const pageText = `${index + 1}/${finalPages.length}`;
      const pageWidth = bold.widthOfTextAtSize(pageText, 6.5);
      page.drawText(pageText, {
        x: PAGE_WIDTH - margin - pageWidth,
        y: 19,
        size: 6.5,
        font: bold,
        color: colors.gray,
      });
    });
  }

  createPage();
  return { ensureSpace, getPosition, consume, addGap, drawFooter };
}
