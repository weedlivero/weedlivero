import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(request) {
  const headers = { 'Cache-Control': 'no-store' };

  try {
    const origin = request.headers.get('origin');
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://weedlivero.shop';

    if (!origin || origin !== allowedOrigin) {
      return Response.json(
        { error: 'Origine non autorizzata.' },
        { status: 403, headers }
      );
    }

    if (!(await verifyAdminSession())) {
      return Response.json(
        { error: 'Accesso amministratore richiesto.' },
        { status: 401, headers }
      );
    }

    const body = await request.json();

    if (typeof body?.manual_registration_enabled !== 'boolean') {
      return Response.json(
        { error: 'Impostazione non valida.' },
        { status: 400, headers }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return Response.json(
        { error: 'Configurazione Supabase mancante.' },
        { status: 500, headers }
      );
    }

    const db = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await db
      .from('settings')
      .update({
        manual_registration_enabled: body.manual_registration_enabled,
      })
      .eq('id', 1)
      .select('manual_registration_enabled')
      .single();

    if (error) throw error;

    return Response.json(
      {
        success: true,
        manual_registration_enabled:
          data.manual_registration_enabled === true,
      },
      { headers }
    );
  } catch (error) {
    console.error('Errore aggiornamento registrazione:', error);

    return Response.json(
      { error: 'Impossibile aggiornare la registrazione.' },
      { status: 500, headers }
    );
  }
}