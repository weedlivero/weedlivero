import bcrypt from 'bcryptjs';
import { customerDb, customerLimit, isSameOrigin, noStore, startCustomerSession, trustedClientIp } from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (process.env.CUSTOMER_LOGIN_ENABLED !== 'true') {
    return noStore({ error: 'Accesso clienti non ancora disponibile.' }, 503);
  }
  if (!isSameOrigin(request)) return noStore({ error: 'Origine non autorizzata.' }, 403);
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    return noStore({ error: 'Formato richiesta non valido.' }, 415);
  }
  try {
    const ip = trustedClientIp(request);
    if (!ip) return noStore({ error: 'Impossibile verificare la richiesta.' }, 503);
    const db = customerDb();
    const ipAllowed = await customerLimit(db, 'customer_login_ip', ip, 10);
    if (ipAllowed === null) return noStore({ error: 'Protezione temporaneamente non disponibile.' }, 503);
    if (!ipAllowed) return noStore({ error: 'Troppi tentativi. Riprova piu tardi.' }, 429);

    const raw = await request.text();
    if (raw.length > 4096) return noStore({ error: 'Richiesta troppo grande.' }, 413);
    const body = JSON.parse(raw);
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!/^[a-z0-9_]{3,32}$/.test(username) || !password || password.length > 128) {
      return noStore({ error: 'Credenziali non valide.' }, 401);
    }
    const userAllowed = await customerLimit(db, 'customer_login_username', username, 10);
    if (userAllowed === null) return noStore({ error: 'Protezione temporaneamente non disponibile.' }, 503);
    if (!userAllowed) return noStore({ error: 'Troppi tentativi. Riprova piu tardi.' }, 429);

    const { data: account, error } = await db.from('customer_accounts')
      .select('id,username,password_hash,approval_status,is_active,must_change_password')
      .eq('username', username).maybeSingle();
    if (error) throw error;
    // Always run bcrypt to reduce username enumeration via response timing.
    const dummy = '$2b$12$C6UzMDM.H6dfI/f/IKcEeOq6t.EDR7vS0E.5YrEVDBQvWdV/tfa5G';
    const passwordOk = await bcrypt.compare(password, account?.password_hash || dummy);
    if (!account || !passwordOk || account.approval_status !== 'approved' || !account.is_active) {
      return noStore({ error: 'Credenziali non valide oppure account non abilitato.' }, 401);
    }
    if (account.must_change_password) {
      return noStore({ error: 'Cambio password obbligatorio. Contatta l’amministratore.' }, 403);
    }
    await startCustomerSession(db, account.id);
    return noStore({ success: true, username: account.username });
  } catch (error) {
    if (error instanceof SyntaxError) return noStore({ error: 'JSON non valido.' }, 400);
    console.error('Login cliente:', error?.code || error?.message);
    return noStore({ error: 'Accesso temporaneamente non disponibile.' }, 500);
  }
}
