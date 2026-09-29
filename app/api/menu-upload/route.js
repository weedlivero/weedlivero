import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function noStoreHeaders() {
  return {
    'Cache-Control':
      'no-store, no-cache, must-revalidate',
  };
}

export async function POST(request) {
  try {
    const supabaseAdmin =
      getSupabaseAdmin();

    if (!supabaseAdmin) {
      return Response.json(
        {
          error:
            'Configurazione Supabase mancante',
        },
        { status: 500 }
      );
    }

    const formData =
      await request.formData();

    const file = formData.get('file');

    if (
      !file ||
      typeof file === 'string'
    ) {
      return Response.json(
        {
          error: 'Seleziona un file PDF.',
        },
        { status: 400 }
      );
    }

    const fileName =
      String(file.name || '').trim();

    const isPdf =
      file.type === 'application/pdf' ||
      fileName.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return Response.json(
        {
          error:
            'Il file selezionato deve essere un PDF.',
        },
        { status: 400 }
      );
    }

    /*
     * Limite di sicurezza: 20 MB.
     */
    const maxSize =
      20 * 1024 * 1024;

    if (file.size > maxSize) {
      return Response.json(
        {
          error:
            'Il PDF non può superare 20 MB.',
        },
        { status: 400 }
      );
    }

    const pdfBytes =
      Buffer.from(
        await file.arrayBuffer()
      );

    /*
     * Usiamo sempre lo stesso percorso.
     * In questo modo il nuovo menu sostituisce
     * quello precedente senza accumulare file.
     */
    const storagePath =
      'current/menu-weedlivero.pdf';

    const { error: uploadError } =
      await supabaseAdmin.storage
        .from('menu-pdf')
        .upload(
          storagePath,
          pdfBytes,
          {
            contentType:
              'application/pdf',
            upsert: true,
            cacheControl: '0',
          }
        );

    if (uploadError) {
      console.error(
        'Errore upload menu PDF:',
        uploadError
      );

      return Response.json(
        {
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Salviamo nelle impostazioni il PDF
     * pubblicato e attiviamo la modalità manuale.
     */
    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from('settings')
      .update({
        menu_pdf_mode: 'manual',
        menu_pdf_path: storagePath,
        menu_pdf_name:
          fileName ||
          'menu-weedlivero.pdf',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', 1)
      .select(`
        menu_pdf_mode,
        menu_pdf_path,
        menu_pdf_name
      `)
      .single();

    if (settingsError) {
      console.error(
        'Errore salvataggio menu:',
        settingsError
      );

      return Response.json(
        {
          error:
            settingsError.message,
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        settings,
      },
      {
        headers: noStoreHeaders(),
      }
    );
  } catch (error) {
    console.error(
      'Errore caricamento menu PDF:',
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore durante il caricamento del PDF',
      },
      { status: 500 }
    );
  }
}