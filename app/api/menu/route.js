import { createClient } from '@supabase/supabase-js';
import { getProducts } from '@/lib/products';
import { generateMenuPdf } from '@/lib/pdf/menu-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function pdfHeaders(fileName) {
  const safeFileName =
    String(fileName || 'menu-weedlivero.pdf')
      .replace(/["\r\n]/g, '')
      .trim() || 'menu-weedlivero.pdf';

  return {
    'Content-Type': 'application/pdf',
    'Content-Disposition':
      `attachment; filename="${safeFileName}"`,
    'Cache-Control':
      'no-store, no-cache, must-revalidate, max-age=0',
  };
}

export async function GET() {
  try {
    const supabaseAdmin =
      getSupabaseAdmin();

    if (!supabaseAdmin) {
      throw new Error(
        'Configurazione Supabase mancante'
      );
    }

    /*
     * Leggiamo la modalità attualmente
     * configurata nell'Admin.
     */
    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from('settings')
      .select(`
        menu_pdf_mode,
        menu_pdf_path,
        menu_pdf_name
      `)
      .eq('id', 1)
      .single();

    if (settingsError) {
      throw settingsError;
    }

    /*
     * MODALITÀ MANUALE
     *
     * Scarichiamo il PDF pubblicato
     * dall'Admin dal bucket privato.
     */
    if (settings?.menu_pdf_mode === 'manual') {
      if (!settings.menu_pdf_path) {
        return Response.json(
          {
            error:
              'Nessun menu PDF manuale è stato pubblicato.',
          },
          {
            status: 404,
            headers: {
              'Cache-Control': 'no-store',
            },
          }
        );
      }

      const {
        data: pdfFile,
        error: downloadError,
      } = await supabaseAdmin.storage
        .from('menu-pdf')
        .download(settings.menu_pdf_path);

      if (downloadError) {
        throw downloadError;
      }

      const pdfBytes =
        await pdfFile.arrayBuffer();

      return new Response(pdfBytes, {
        status: 200,
        headers: pdfHeaders(
          settings.menu_pdf_name ||
            'menu-weedlivero.pdf'
        ),
      });
    }

    /*
     * MODALITÀ AUTOMATICA
     *
     * Manteniamo il generatore che avevamo
     * già costruito.
     */
    const products = await getProducts();

    const pdfBytes =
      await generateMenuPdf(products);

    return new Response(pdfBytes, {
      status: 200,
      headers: pdfHeaders(
        'menu-weedlivero.pdf'
      ),
    });
  } catch (error) {
    console.error(
      'Errore menu PDF:',
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore durante il caricamento del menu PDF',
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