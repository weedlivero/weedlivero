export async function embedRemoteImage(pdfDocument, url) {
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('png') || url.toLowerCase().includes('.png')) {
      return await pdfDocument.embedPng(bytes);
    }

    return await pdfDocument.embedJpg(bytes);
  } catch (error) {
    console.warn('Immagine prodotto non inserita nel PDF:', error);
    return null;
  }
}

export async function prepareProductImages(pdfDocument, products) {
  const entries = await Promise.all(
    products.map(async (product) => [
      product.id,
      await embedRemoteImage(pdfDocument, product.image_url),
    ])
  );

  return new Map(entries);
}
