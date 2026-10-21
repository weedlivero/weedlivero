import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';

export async function POST(request) {
  if (!(await verifyAdminSession())) {
      return Response.json(
        { error: 'Accesso amministratore richiesto' },
        { status: 401 }
      );
    }

    const origin = request.headers.get('origin');
    let authorizedOrigin = false;

    try {
      const target = new URL(request.url);
      const source = new URL(origin || '');
      authorizedOrigin =
        source.protocol === target.protocol &&
        source.host === target.host;
    } catch {
      authorizedOrigin = false;
    }

    if (!authorizedOrigin) {
      return Response.json(
        { error: 'Origine richiesta non autorizzata' },
        { status: 403 }
      );
    }

    if (!(request.headers.get('content-type') || '')
      .toLowerCase().startsWith('application/json')) {
      return Response.json(
        { error: 'Formato richiesta non valido' },
        { status: 415 }
      );
    }
  try {
    const { fileName, fileType, folder = 'images' } = await request.json();

    if (!fileName) {
      return Response.json(
        { error: 'Nome del file mancante' },
        { status: 400 }
      );
    }

    if (!['images', 'videos'].includes(folder)) {
      return Response.json(
        { error: 'Cartella non valida' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const extension =
      fileName.includes('.')
        ? fileName.split('.').pop().toLowerCase()
        : folder === 'videos'
          ? 'mp4'
          : 'jpg';

    const safeExtension = extension.replace(/[^a-z0-9]/g, '');

    const path = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${safeExtension}`;

    const { data, error } = await supabaseAdmin.storage
      .from('product-media')
      .createSignedUploadUrl(path);

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      path,
      token: data.token,
      contentType: fileType || null,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore creazione upload',
      },
      { status: 500 }
    );
  }
}