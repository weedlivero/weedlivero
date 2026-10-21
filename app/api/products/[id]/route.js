import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';
import { getCatalogAccess } from '@/lib/catalog-access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const target = new URL(request.url);
    const source = new URL(origin);
    return source.protocol === target.protocol && source.host === target.host;
  } catch { return false; }
}

async function authorize(request) {
  if (!(await verifyAdminSession())) return Response.json({ error: 'Accesso amministratore richiesto' }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: 'Origine richiesta non autorizzata' }, { status: 403 });
  return null;
}

function badJson(body) {
  return !body || typeof body !== 'object' || Array.isArray(body);
}

export async function GET(request, { params }) {
  try {
    const protectionEnabled = process.env.CUSTOMER_CATALOG_PROTECTION_ENABLED === 'true';
    let isAdmin = false;

    if (protectionEnabled) {
      isAdmin = await verifyAdminSession();
      if (!isAdmin) {
        const access = await getCatalogAccess();
        if (!access.allowed) {
          return Response.json(
            { error: 'Accesso al catalogo richiesto.' },
            { status: 401, headers: { 'Cache-Control': 'no-store' } }
          );
        }
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return Response.json({ error: 'Configurazione Supabase mancante' }, { status: 500 });
    const productId = params.id;
    if (!productId) return Response.json({ error: 'Codice prodotto mancante' }, { status: 400 });
    const catalogFields = 'id,name,brand,category,description,notes,image_url,video_url,thc,cbd,quality_level,price_unit,price_1g,price_3g,price_5g,price_10g,price_20g,price_50g,price_100g,price_promo,menu_order,active,featured,sold_out';
    let query = supabaseAdmin.from('products').select(protectionEnabled && !isAdmin ? catalogFields : '*').eq('id', productId);
    if (protectionEnabled && !isAdmin) {
      query = query.eq('active', true);
    }
    const { data, error } = await query.single();
    if (error) return Response.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
    return Response.json({ product: data }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return Response.json({ error: 'Errore durante il caricamento del prodotto' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const denial = await authorize(request);
    if (denial) return denial;
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return Response.json({ error: 'Configurazione Supabase mancante' }, { status: 500 });
    const productId = params.id;
    if (!productId) return Response.json({ error: 'Codice prodotto mancante' }, { status: 400 });
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'JSON non valido' }, { status: 400 }); }
    if (badJson(body)) return Response.json({ error: 'Dati prodotto non validi' }, { status: 400 });
    const updates = {
      name: String(body.name ?? '').trim(),
      brand: String(body.brand ?? '').trim(),
      category: String(body.category ?? '').trim(),
      description: String(body.description ?? '').trim(),
      notes: String(body.notes ?? '').trim(),
      image_url: body.image_url ?? '',
      image_path: body.image_path ?? '',
      video_url: body.video_url ?? '',
      video_path: body.video_path ?? '',
      thc: String(body.thc ?? '').trim(),
      cbd: String(body.cbd ?? '').trim(),
      quality_level: numberOrNull(body.quality_level),
      price_unit: numberOrNull(body.price_unit),
      price_1g: numberOrNull(body.price_1g),
      price_3g: numberOrNull(body.price_3g),
      price_5g: numberOrNull(body.price_5g),
      price_10g: numberOrNull(body.price_10g),
      price_20g: numberOrNull(body.price_20g),
      price_50g: numberOrNull(body.price_50g),
      price_100g: numberOrNull(body.price_100g),
      price_promo: String(body.price_promo ?? '').trim(),
      menu_order: numberOrNull(body.menu_order) ?? 0,
      active: body.active === true,
      sold_out: body.sold_out === true,
      featured: body.featured === true,
      pdf_badge: String(body.pdf_badge ?? '').trim(),
    };
    if (!updates.name) return Response.json({ error: 'Nome prodotto obbligatorio' }, { status: 400 });
    if (!updates.category) return Response.json({ error: 'Categoria prodotto obbligatoria' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('products').update(updates).eq('id', productId).select().single();
    if (error) return Response.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
    return Response.json({ success: true, product: data }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error) {
    console.error('Errore aggiornamento prodotto:', error);
    return Response.json({ error: 'Errore durante l’aggiornamento del prodotto' }, { status: 500 });
  }
}
