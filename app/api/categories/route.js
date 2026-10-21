import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';
import { getCatalogAccess } from '@/lib/catalog-access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function reply(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET() {
  try {
    const protectionEnabled = process.env.CUSTOMER_CATALOG_PROTECTION_ENABLED === 'true';
    let isAdmin = false;

    if (protectionEnabled) {
      isAdmin = await verifyAdminSession();
      if (!isAdmin) {
        const access = await getCatalogAccess();
        if (!access.allowed) {
          return reply({ error: 'Accesso al catalogo richiesto.' }, 401);
        }
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return reply({ error: 'Configurazione Supabase mancante' }, 500);
    }

    // Con la protezione disattivata manteniamo il comportamento originale.
    // Con la protezione attiva, gli amministratori ricevono tutte le categorie.
    // Clienti e ospiti autorizzati ricevono soltanto quelle attive.
    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (protectionEnabled && !isAdmin) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Errore caricamento categorie:', error);
      return reply({ error: 'Impossibile caricare le categorie.' }, 500);
    }

    return reply({ categories: data || [] });
  } catch (error) {
    console.error('Errore GET categorie:', error);
    return reply({ error: 'Errore caricamento categorie.' }, 500);
  }
}
