
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';
import { verifyMenuUploadIntent } from '@/lib/menu-upload-intent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'menu-pdf';
const MAX_PDF_SIZE = 20 * 1024 * 1024;

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
    return (
      new URL(origin).origin ===
      new URL(request.url).origin
    );
  } catch {
    return false;
  }
}

function jsonError(message, status) {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(request) {
  try {
    // 1. Controllo origine della richiesta.
    if (!isSameOrigin(request)) {
      return jsonError(
        'Origine richiesta non autorizzata.',
        403
      );
    }

    // 2. Controllo sessione amministrativa.
    if (!(await verifyAdminSession())) {
      return jsonError(
        'Accesso amministratore richiesto.',
        401
      );
    }

    // 3. Verifica autorizzazione firmata.
    const body = await request.json();

    let intent;

    try {
      intent = await verifyMenuUploadIntent(
        body?.uploadIntent
      );
    } catch {
      return jsonError(
        'Autorizzazione PDF non valida o scaduta.',
        403
      );
    }

    const {
      storagePath,
      fileName,
      fileSize,
    } = intent;

    const supabase = getSupabaseAdmin();

    // 4. Verifica presenza del file su Supabase.
    const { data: fileInfo, error: infoError } =
      await supabase.storage
        .from(BUCKET)
        .info(storagePath);

    if (infoError || !fileInfo) {
      return jsonError(
        'PDF non trovato su Supabase Storage.',
        404
      );
    }

    // 5. Verifica dimensione effettiva.
    const actualSize = Number(fileInfo.size);

    if (
      !Number.isSafeInteger(actualSize) ||
      actualSize <= 0 ||
      actualSize > MAX_PDF_SIZE ||
      actualSize !== fileSize
    ) {
      return jsonError(
        'Dimensione del PDF non valida.',
        400
      );
    }

    // 6. Verifica MIME registrato.
    const contentType = String(
      fileInfo.contentType ||
      fileInfo.metadata?.mimetype ||
      ''
    )
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (
      contentType &&
      contentType !== 'application/pdf'
    ) {
      return jsonError(
        'Il file caricato non risulta un PDF.',
        400
      );
    }

    // 7. Generiamo un URL temporaneo per
    // controllare l'intestazione del documento.
    const {
      data: signedData,
      error: signedError,
    } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60);

    if (signedError || !signedData?.signedUrl) {
      return jsonError(
        'Impossibile verificare il PDF.',
        500
      );
    }

    // 8. Richiediamo solo i primi cinque byte.
    // Accettiamo esclusivamente una risposta 206.
    const headerResponse = await fetch(
      signedData.signedUrl,
      {
        method: 'GET',
        headers: {
          Range: 'bytes=0-4',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      }
    );

    const contentRange =
      headerResponse.headers.get('content-range');

    if (
      headerResponse.status !== 206 ||
      !contentRange ||
      !/^bytes 0-4\/[0-9]+$/.test(contentRange)
    ) {
      await headerResponse.body?.cancel();

      return jsonError(
        'Verifica parziale del PDF non disponibile.',
        500
      );
    }

    const headerBytes = new Uint8Array(
      await headerResponse.arrayBuffer()
    );

    // 9. Verifica firma PDF: %PDF-
    const pdfSignature = '%PDF-';

    const isPdfSignature =
      headerBytes.length === 5 &&
      headerBytes.every(
        (byte, index) =>
          byte === pdfSignature.charCodeAt(index)
      );

    if (!isPdfSignature) {
      return jsonError(
        'Il contenuto caricato non è un PDF valido.',
        400
      );
    }

    // 10. Pubblicazione del nuovo catalogo.
    // Il PDF precedente rimane disponibile
    // fino al completamento dell'aggiornamento.
    const {
      data: settings,
      error: settingsError,
    } = await supabase
      .from('settings')
      .update({
        menu_pdf_mode: 'manual',
        menu_pdf_path: storagePath,
        menu_pdf_name: fileName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select(
        'menu_pdf_mode,menu_pdf_path,menu_pdf_name'
      )
      .single();

    if (settingsError) {
      console.error(
        'Errore pubblicazione PDF:',
        settingsError
      );

      return jsonError(
        'PDF caricato ma pubblicazione non riuscita.',
        500
      );
    }

    return Response.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error(
      'Errore completamento upload PDF:',
      error
    );

    return jsonError(
      'Errore durante la pubblicazione del PDF.',
      500
    );
  }
}
