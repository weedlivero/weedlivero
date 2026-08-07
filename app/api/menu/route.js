import { getProducts } from '@/lib/products';
import { generateMenuPdf } from '@/lib/pdf/menu-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const products = await getProducts();

    const pdfBytes = await generateMenuPdf(products);

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
    console.error(
      'Errore generazione menu PDF:',
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore durante la generazione del menu PDF',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}