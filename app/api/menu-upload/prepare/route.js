
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { verifyAdminSession } from '@/lib/admin-session';
import { createMenuUploadIntent } from '@/lib/menu-upload-intent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PDF_SIZE = 20 * 1024 * 1024;
const BUCKET = 'menu-pdf';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Configurazione Supabase mancante');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');

  if (!origin) return false;

  try {
    const requestUrl = new URL(request.url);

    return (
      new URL(origin).origin === requestUrl.origin
    );
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    // Verifica che la richiesta provenga
    // dallo stesso sito Weedlivero.
    if (!isSameOrigin(request)) {
      return Response.json(
        {
          error: 'Origine richiesta non autorizzata.',
        },
        { status: 403 }
      );
    }

    // Verifica la sessione amministrativa.
    const authenticated = await verifyAdminSession();

    if (!authenticated) {
      return Response.json(
        {
          error: 'Accesso amministratore richiesto.',
        },
        { status: 401 }
      );
    }

    // Riceviamo solo i dati del PDF,
    // non il contenuto del file.
    const body = await request.json();

    const fileName = String(
      body?.fileName || ''
    ).trim();

    const fileSize = Number(body?.fileSize);

    // Controlliamo nome e dimensione.
    if (
      !fileName ||
      fileName.length > 255 ||
      !fileName.toLowerCase().endsWith('.pdf') ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_PDF_SIZE
    ) {
      return Response.json(
        {
          error: 'PDF non valido o superiore a 20 MB.',
        },
        { status: 400 }
      );
    }

    // Creiamo un percorso unico:
    // il vecchio PDF non viene sovrascritto.
    const storagePath =
      `uploads/${randomUUID()}.pdf`;

    const supabase = getSupabaseAdmin();

    // Generiamo il token temporaneo
    // per il caricamento diretto su Supabase.
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.token) {
      console.error(
        'Errore preparazione PDF:',
        error
      );

      return Response.json(
        {
          error: 'Impossibile preparare il caricamento.',
        },
        { status: 500 }
      );
    }

    // Creiamo anche l'autorizzazione firmata
    // che servirà per pubblicare il PDF.
    const uploadIntent =
      await createMenuUploadIntent({
        storagePath,
        fileName,
        fileSize,
      });

    return Response.json(
      {
        success: true,
        storagePath,
        uploadToken: data.token,
        uploadIntent,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error(
      'Errore preparazione PDF:',
      error
    );

    return Response.json(
      {
        error: 'Errore durante la preparazione del PDF.',
      },
      { status: 500 }
    );
  }
}
