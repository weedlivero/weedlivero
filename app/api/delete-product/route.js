import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(message, status) {
  return Response.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function validId(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0;
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(value);
}

export async function POST(request) {
  try {
    if (!sameOrigin(request)) {
      return errorResponse('Origine richiesta non autorizzata.', 403);
    }

    if (!(await verifyAdminSession())) {
      return errorResponse('Accesso amministratore richiesto.', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Richiesta JSON non valida.', 400);
    }

    const id = body?.id;
    if (!validId(id)) {
      return errorResponse('ID prodotto non valido.', 400);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return errorResponse('Configurazione Supabase mancante.', 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // I percorsi dei file provengono dal database, mai dal browser.
    const { data: product, error: readError } = await supabaseAdmin
      .from('products')
      .select('id,image_path,video_path')
      .eq('id', id)
      .maybeSingle();

    if (readError) {
      console.error('Errore lettura prodotto:', readError);
      return errorResponse('Impossibile leggere il prodotto.', 500);
    }
    if (!product) {
      return errorResponse('Prodotto non trovato.', 404);
    }

    // Eliminiamo prima il record: se il DB fallisce, i file restano intatti.
    const { data: deleted, error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .select('id');

    if (deleteError) {
      console.error('Errore eliminazione prodotto:', deleteError);
      return errorResponse('Impossibile eliminare il prodotto.', 500);
    }
    if (!deleted?.length) {
      return errorResponse('Prodotto non eliminato.', 409);
    }

    const paths = [...new Set([product.image_path, product.video_path]
      .filter((p) => typeof p === 'string' && p.length > 0))];

    // Pulizia best-effort: un problema Storage non ripristina il record DB.
    if (paths.length) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('product-media')
        .remove(paths);
      if (storageError) {
        console.error('Prodotto eliminato, pulizia media non riuscita:', storageError);
      }
    }

    return Response.json({ success: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Errore API delete-product:', error);
    return errorResponse('Errore durante l’eliminazione del prodotto.', 500);
  }
}
