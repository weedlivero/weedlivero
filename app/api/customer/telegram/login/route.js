import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import {
  customerDb,
  customerLimit,
  digest,
  isSameOrigin,
  noStore,
  startCustomerSession,
  trustedClientIp,
} from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (process.env.CUSTOMER_LOGIN_ENABLED !== 'true') {
    return noStore({ error: 'Accesso clienti non disponibile.' }, 503);
  }

  if (!isSameOrigin(request)) {
    return noStore({ error: 'Origine non autorizzata.' }, 403);
  }

  if (!(request.headers.get('content-type') || '')
    .toLowerCase().startsWith('application/json')) {
    return noStore({ error: 'Formato non valido.' }, 415);
  }

  try {
    const ip = trustedClientIp(request);

    if (!ip) {
      return noStore({ error: 'Richiesta non verificabile.' }, 503);
    }

    const db = customerDb();

    const allowed = await customerLimit(
      db,
      'customer_telegram_login_ip',
      ip,
      10
    );

    if (allowed !== true) {
      return noStore({
        error: allowed === null
          ? 'Protezione temporaneamente non disponibile.'
          : 'Troppi tentativi.',
      }, allowed === null ? 503 : 429);
    }

    const raw = await request.text();

    if (raw.length > 1024) {
      return noStore({ error: 'Richiesta troppo grande.' }, 413);
    }

    const body = JSON.parse(raw);
    const token = body?.verificationToken;

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return noStore({ error: 'Verifica Telegram non valida.' }, 400);
    }

    const internalPassword = randomBytes(48).toString('base64url');
    const passwordHash = await bcrypt.hash(internalPassword, 12);

    const { data: accountId, error } = await db.rpc(
      'customer_login_with_telegram',
      {
        p_token_hash: digest(token),
        p_password_hash: passwordHash,
      }
    );

    if (error) {
      console.error('Accesso Telegram:', error.code);
      return noStore({
        error: 'Accesso Telegram non riuscito o account non abilitato.',
      }, 403);
    }

    if (!accountId) {
      return noStore({ error: 'Account non disponibile.' }, 403);
    }

    await startCustomerSession(db, accountId);

    return noStore({ success: true });

  } catch (error) {
    if (error instanceof SyntaxError) {
      return noStore({ error: 'JSON non valido.' }, 400);
    }

    console.error('Login Telegram:', error?.code || error?.message);
    return noStore({ error: 'Errore temporaneo di accesso.' }, 500);
  }
}
