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
  const { data, error } = await supabase.from('finance_expenses').select('*').order('occurred_on', { ascending: false }).limit(500);
  return error ? reply({ error: error.message }, 500) : reply({ expenses: data });
}
export async function POST(req) {
  const denied = await guard(req, true); if (denied) return denied;
  const supabase = db(); if (!supabase) return reply({ error: 'Configurazione Supabase mancante' }, 500);
  const b = await json(req); if (!b) return reply({ error: 'JSON non valido' }, 400);
  if (!text(b.category, 200) || !text(b.description, 500) || !amount(b.amount)) return reply({ error: 'Categoria, descrizione e importo obbligatori' }, 400);
  const date = b.occurred_on || new Date().toISOString().slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return reply({ error: 'Data non valida' }, 400);
  const { data, error } = await supabase.from('finance_expenses').insert({ category: text(b.category, 200), description: text(b.description, 500), amount: Number(b.amount), occurred_on: date, notes: text(b.notes, 2000) || null }).select().single();
  return error ? reply({ error: error.message }, 400) : reply({ expense: data }, 201);
}
