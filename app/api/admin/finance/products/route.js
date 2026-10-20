import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}
function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try { const a = new URL(origin); const b = new URL(req.url); return a.protocol === b.protocol && a.host === b.host; }
  catch { return false; }
}
async function guard(req, write = false) {
  if (!(await verifyAdminSession())) return Response.json({ error: 'Accesso amministratore richiesto' }, { status: 401 });
  if (write && !sameOrigin(req)) return Response.json({ error: 'Origine non autorizzata' }, { status: 403 });
  return null;
}
function reply(data, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
function text(value, max = 500) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function amount(value) { if (value === '' || value === null || value === undefined) return null; const n = Number(value); return Number.isFinite(n) && n > 0 ? n : null; }
async function json(req) { try { const b = await req.json(); return b && typeof b === 'object' && !Array.isArray(b) ? b : null; } catch { return null; } }

export async function GET(req) {
  const denied = await guard(req); if (denied) return denied;
  const supabase = db(); if (!supabase) return reply({ error: 'Configurazione Supabase mancante' }, 500);
  const { data, error } = await supabase.from('finance_products').select('*').order('name').limit(500);
  return error ? reply({ error: error.message }, 500) : reply({ products: data });
}
export async function POST(req) {
  const denied = await guard(req, true); if (denied) return denied;
  const supabase = db(); if (!supabase) return reply({ error: 'Configurazione Supabase mancante' }, 500);
  const b = await json(req); if (!b) return reply({ error: 'JSON non valido' }, 400);
  const source = b.source; const base_unit = b.base_unit;
  const catalog_product_id = source === 'catalog' ? text(b.catalog_product_id, 100) : null;
  if (!['catalog','internal'].includes(source) || !['g','ml','pcs'].includes(base_unit) || !text(b.name, 200) || (source === 'catalog' && !catalog_product_id)) return reply({ error: 'Nome, origine, codice catalogo e unità non validi' }, 400);
  if (source === 'catalog') {
    const check = await supabase.from('products').select('id').eq('id', catalog_product_id).maybeSingle();
    if (check.error) return reply({ error: check.error.message }, 500);
    if (!check.data) return reply({ error: 'Prodotto del catalogo non trovato' }, 400);
  }
  const payload = { name: text(b.name, 200), source, catalog_product_id, base_unit, sku: text(b.sku, 100) || null, notes: text(b.notes, 2000) || null };
  const { data, error } = await supabase.from('finance_products').insert(payload).select().single();
  return error ? reply({ error: error.code === '23505' ? 'Prodotto già collegato al catalogo' : error.message }, error.code === '23505' ? 409 : 500) : reply({ product: data }, 201);
}
