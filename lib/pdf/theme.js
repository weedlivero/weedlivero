import { rgb, StandardFonts } from 'pdf-lib';

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;

export const PDF_THEME = {
  margin: 26,
  columnGap: 12,
  maxPages: 2,

  colors: {
    background: rgb(0.985, 0.975, 0.94),
    header: rgb(0.01, 0.19, 0.12),
    emerald: rgb(0.02, 0.37, 0.23),
    emeraldDark: rgb(0.01, 0.22, 0.14),
    emeraldSoft: rgb(0.94, 0.98, 0.955),
    gold: rgb(0.82, 0.62, 0.14),
    goldDark: rgb(0.55, 0.36, 0.05),
    goldSoft: rgb(0.99, 0.95, 0.79),
    card: rgb(1, 0.997, 0.985),
    text: rgb(0.08, 0.09, 0.1),
    gray: rgb(0.38, 0.41, 0.43),
    line: rgb(0.84, 0.84, 0.79),
    white: rgb(1, 1, 1),
  },

  fonts: {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    title: StandardFonts.TimesRomanBold,
  },
};

export function getColumnWidth() {
  const { margin, columnGap } = PDF_THEME;
  return (PAGE_WIDTH - margin * 2 - columnGap) / 2;
}

export function getDensity(productCount) {
  if (productCount <= 18) {
    return {
      headerHeight: 92,
      categoryHeight: 22,
      rowHeight: 48,
      nameSize: 9.4,
      secondarySize: 6.4,
      priceSize: 6.7,
      maxNameLength: 24,
      imageSize: 38,
      showImages: true,
    };
  }

  if (productCount <= 30) {
    return {
      headerHeight: 88,
      categoryHeight: 20,
      rowHeight: 42,
      nameSize: 8.6,
      secondarySize: 6,
      priceSize: 6.2,
      maxNameLength: 22,
      imageSize: 32,
      showImages: true,
    };
  }

  if (productCount <= 54) {
    return {
      headerHeight: 84,
      categoryHeight: 18,
      rowHeight: 34,
      nameSize: 7.8,
      secondarySize: 5.5,
      priceSize: 5.8,
      maxNameLength: 21,
      imageSize: 0,
      showImages: false,
    };
  }

  if (productCount <= 80) {
    return {
      headerHeight: 80,
      categoryHeight: 16,
      rowHeight: 28,
      nameSize: 7,
      secondarySize: 5,
      priceSize: 5.3,
      maxNameLength: 19,
      imageSize: 0,
      showImages: false,
    };
  }

  return {
    headerHeight: 76,
    categoryHeight: 14,
    rowHeight: 23,
    nameSize: 6.3,
    secondarySize: 4.6,
    priceSize: 4.9,
    maxNameLength: 17,
    imageSize: 0,
    showImages: false,
  };
}
