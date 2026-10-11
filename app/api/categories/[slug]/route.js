import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function reply(data, status = 200) {
  return Response.json(data, {
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

export async function PATCH(request, { params }) {
  try {
    if (!sameOrigin(request)) {
      return reply({ error: 'Origine richiesta non autorizzata.' }, 403);
    }
    if (!(await verifyAdminSession())) {
      return reply({ error: 'Accesso amministratore richiesto.' }, 401);
    }

    const slug = params?.slug;
    if (typeof slug !== 'string' || !slug.trim()) {
      return reply({ error: 'Categoria non valida.' }, 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return reply({ error: 'JSON non valido.' }, 400);
    }
    if (typeof body?.active !== 'boolean') {
      return reply({ error: 'Il campo active deve essere booleano.' }, 400);
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return reply({ error: 'Configurazione Supabase mancante.' }, 500);
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ active: body.active })
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return reply({ error: 'Categoria non trovata.' }, 404);
      }
      console.error('Errore aggiornamento categoria:', error);
      return reply({ error: 'Impossibile aggiornare la categoria.' }, 500);
    }

    return reply({ success: true, category: data });
  } catch (error) {
    console.error('Errore PATCH categoria:', error);
    return reply({ error: 'Errore durante aggiornamento categoria.' }, 500);
  }
}
