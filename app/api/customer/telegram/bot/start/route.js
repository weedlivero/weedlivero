import { randomBytes, createHash } from 'node:crypto';
import {
  customerDb,
  customerLimit,
  isSameOrigin,
  noStore,
  trustedClientIp,
} from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sha256 = (value) =>
  createHash('sha256').update(value).digest('hex');

export async function POST(request) {
  if (process.env.CUSTOMER_REGISTRATION_ENABLED !== 'true') {
    return noStore({ error: 'Registrazione non disponibile.' }, 503);
  }

  if (!isSameOrigin(request)) {
    return noStore({ error: 'Origine non autorizzata.' }, 403);
  }

  if (request.headers.get('content-type') !== 'application/json') {
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
      'customer_telegram_bot_start_ip',
      ip,
      20
    );

    if (allowed === null) {
      return noStore({ error: 'Protezione non disponibile.' }, 503);
    }

    if (!allowed) {
      return noStore({ error: 'Troppi tentativi.' }, 429);
    }

    const code = randomBytes(24).toString('base64url');
    const browserSecret = randomBytes(32).toString('hex');

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    ).toISOString();

    const { error } = await db
      .from('customer_telegram_bot_requests')
      .insert({
        request_hash: sha256(code),
        browser_secret_hash: sha256(browserSecret),
        status: 'pending',
        expires_at: expiresAt,
      });

    if (error) {
      console.error('Telegram bot start:', error.code);
      return noStore({
        error: 'Impossibile avviare la verifica.',
      }, 503);
    }

    return noStore({
      success: true,
      botUrl: `https://t.me/wliveroverifybot?start=${code}`,
      requestCode: code,
      browserSecret,
      expiresAt,
    });

  } catch (error) {
    console.error('Telegram bot start:', error?.code || error?.message);
    return noStore({ error: 'Errore interno.' }, 500);
  }
}
