import { PDF_THEME } from '@/lib/pdf/theme';
import {
  buildMetaText,
  buildPriceText,
  truncateText,
} from '@/lib/pdf/utils';

function drawQualityDots({
  page,
  x,
  y,
  level,
  radius,
}) {
  const { colors } = PDF_THEME;
  const value = Math.min(
    5,
    Math.max(0, Number(level || 0))
  );

  for (let index = 0; index < 5; index += 1) {
    page.drawCircle({
      x: x + index * (radius * 2 + 2.1),
      y,
      size: radius,
      color:
        index < value
          ? colors.emerald
          : colors.white,
      borderColor: colors.emerald,
      borderWidth: 0.5,
    });
  }
}

export function drawProductCard({
  page,
  product,
  productImage,
  x,
  y,
  columnWidth,
  density,
  fonts,
}) {
  const { colors } = PDF_THEME;
  const { bold } = fonts;

  page.drawRectangle({
    x,
    y: y - density.rowHeight + 2,
    width: columnWidth,
    height: density.rowHeight,
    color: colors.card,
    borderColor:
      product.featured
        ? colors.gold
        : colors.line,
    borderWidth:
      product.featured
        ? 1
        : 0.6,
  });

  const imageSize =
    density.showImages
      ? density.imageSize
      : 0;

  const imageX = x + 5;
  const imageY =
    y -
    density.rowHeight +
    2 +
    (density.rowHeight - imageSize) / 2;

  if (density.showImages && productImage) {
    const scale = Math.max(
      imageSize / productImage.width,
      imageSize / productImage.height
    );

    const width = productImage.width * scale;
    const height = productImage.height * scale;

    page.drawImage(productImage, {
      x: imageX + (imageSize - width) / 2,
      y: imageY + (imageSize - height) / 2,
      width,
      height,
    });
  }

  const textX =
    density.showImages
      ? imageX + imageSize + 8
      : x + 8;

  const id = truncateText(product.id, 12);
  const name = truncateText(
    product.name || 'Prodotto',
    density.maxNameLength
  );

  const prices = buildPriceText(product);
  const meta = buildMetaText(product);
  const promo = truncateText(
    product.price_promo,
    18
  );

  page.drawText(name, {
    x: textX,
    y: y - 10,
    size: density.nameSize,
    font: bold,
    color: colors.text,
  });

  if (id) {
    const idWidth = bold.widthOfTextAtSize(
      id,
      density.secondarySize
    );

    page.drawText(id, {
      x:
        x +
        columnWidth -
        idWidth -
        7,
      y: y - 9,
      size: density.secondarySize,
      font: bold,
      color: colors.emerald,
    });
  }

  const detailY =
    y -
    Math.min(
      22,
      density.rowHeight * 0.48
    );

  if (product.quality_level) {
    drawQualityDots({
      page,
      x: textX + 1,
      y: detailY,
      level: product.quality_level,
      radius: Math.max(
        1.35,
        density.secondarySize / 3.2
      ),
    });
  }

  if (meta) {
    page.drawText(meta, {
      x: textX + 45,
      y: detailY - 2,
      size: density.secondarySize,
      font: bold,
      color: colors.emeraldDark,
    });
  }

  if (prices) {
    const maxPriceLength =
      density.showImages
        ? 46
        : density.rowHeight <= 30
          ? 48
          : 66;

    page.drawText(
      truncateText(
        prices,
        maxPriceLength
      ),
      {
        x: textX,
        y:
          y -
          density.rowHeight +
          8,
        size: density.priceSize,
        font: bold,
        color: colors.text,
      }
    );
  }

  if (promo) {
    const promoText = `PROMO ${promo}`;
    const promoWidth =
      bold.widthOfTextAtSize(
        promoText,
        density.priceSize
      );

    const badgeWidth =
      Math.min(
        promoWidth + 9,
        columnWidth * 0.42
      );

    page.drawRectangle({
      x:
        x +
        columnWidth -
        badgeWidth -
        6,
      y:
        y -
        density.rowHeight +
        4,
      width: badgeWidth,
      height:
        density.priceSize +
        7,
      color: colors.gold,
      borderColor: colors.goldDark,
      borderWidth: 0.35,
    });

    page.drawText(
      truncateText(promoText, 18),
      {
        x:
          x +
          columnWidth -
          badgeWidth -
          1.5,
        y:
          y -
          density.rowHeight +
          7.5,
        size: density.priceSize,
        font: bold,
        color: colors.text,
      }
    );
  }

  return density.rowHeight + 3;
}
