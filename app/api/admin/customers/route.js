import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store' };
const reply = (data, status = 200) => Response.json(data, { status, headers: noStore });

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Configurazione Supabase mancante');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET() {
  if (!(await verifyAdminSession())) return reply({ error: 'Non autorizzato' }, 401);
  try {
    const { data, error } = await db().from('customer_accounts')
      .select('id,username,approval_status,is_active,created_at,approved_at,must_change_password')
      .order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    return reply({ users: data || [] });
  } catch (e) {
    console.error('Gestione utenti GET:', e);
    return reply({ error: 'Impossibile caricare gli utenti' }, 500);
  }
}

export async function PATCH(request) {
  if (!(await verifyAdminSession())) return reply({ error: 'Non autorizzato' }, 401);
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return reply({ error: 'Origine non autorizzata' }, 403);
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    return reply({ error: 'Formato non valido' }, 415);
  }
  try {
    const raw = await request.text();
    if (raw.length > 2048) return reply({ error: 'Richiesta troppo grande' }, 413);
    const { id, action } = JSON.parse(raw);
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return reply({ error: 'ID non valido' }, 400);
    }
    if (!['approve', 'reject', 'suspend', 'reactivate'].includes(action)) return reply({ error: 'Azione non valida' }, 400);
    const client = db();
    const { data: current, error: readError } = await client.from('customer_accounts')
      .select('id,approval_status,is_active').eq('id', id).single();
    if (readError || !current) return reply({ error: 'Utente non trovato' }, 404);
    let changes;
    if (action === 'approve' && current.approval_status === 'pending') {
      changes = { approval_status: 'approved', is_active: true, approved_at: new Date().toISOString() };
    } else if (action === 'reject' && current.approval_status === 'pending') {
      changes = { approval_status: 'rejected', is_active: false };
    } else if (action === 'suspend' && current.approval_status === 'approved' && current.is_active) {
      changes = { is_active: false };
    } else if (action === 'reactivate' && current.approval_status === 'approved' && !current.is_active) {
      changes = { is_active: true };
    } else return reply({ error: 'Azione non consentita nello stato attuale' }, 409);

    const { data: updated, error: updateError } = await client.from('customer_accounts')
      .update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id)
      .eq('approval_status', current.approval_status).eq('is_active', current.is_active)
      .select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return reply({ error: 'Stato modificato nel frattempo: aggiorna la pagina' }, 409);
    if (action === 'suspend' || action === 'reject') {
      const { error: revokeError } = await client.from('customer_sessions').update({ revoked_at: new Date().toISOString() })
        .eq('account_id', id).is('revoked_at', null);
      if (revokeError) {
        console.error('Revoca sessioni fallita:', revokeError);
        return reply({ error: 'Stato aggiornato, ma revoca sessioni non riuscita: riprova o verifica le sessioni' }, 500);
      }
    }
    return reply({ success: true });
  } catch (e) {
    if (e instanceof SyntaxError) return reply({ error: 'JSON non valido' }, 400);
    console.error('Gestione utenti PATCH:', e);
    return reply({ error: 'Impossibile aggiornare utente' }, 500);
  }
}
