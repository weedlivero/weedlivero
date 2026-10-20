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
  const { data, error } = await supabase.from('finance_stock_movements').select('*').order('occurred_on', { ascending: false }).order('created_at', { ascending: false }).limit(500);
  return error ? reply({ error: error.message }, 500) : reply({ movements: data });
}
export async function POST(req) {
  const denied = await guard(req, true); if (denied) return denied;
  const supabase = db(); if (!supabase) return reply({ error: 'Configurazione Supabase mancante' }, 500);
  const b = await json(req); if (!b) return reply({ error: 'JSON non valido' }, 400);
  if (!['purchase','sale','adjustment_in','adjustment_out'].includes(b.kind) || !['g','kg','ml','pcs'].includes(b.unit) || !amount(b.quantity) || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(b.product_id ?? ''))) return reply({ error: 'Movimento non valido' }, 400);
  const price = b.unit_price === '' || b.unit_price == null ? null : Number(b.unit_price);
  if ((['purchase','sale'].includes(b.kind) && (price === null || !Number.isFinite(price) || price < 0)) || (price !== null && (!Number.isFinite(price) || price < 0))) return reply({ error: 'Prezzo non valido' }, 400);
  const date = b.occurred_on || new Date().toISOString().slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return reply({ error: 'Data non valida' }, 400);
  const { data, error } = await supabase.from('finance_stock_movements').insert({ product_id: b.product_id, kind: b.kind, quantity: Number(b.quantity), unit: b.unit, unit_price: price, occurred_on: date, supplier_or_customer: text(b.supplier_or_customer, 200) || null, notes: text(b.notes, 2000) || null }).select().single();
  return error ? reply({ error: error.message }, 400) : reply({ movement: data }, 201);
}
