import { randomBytes } from 'node:crypto';
import {
  customerDb,
  customerLimit,
  digest,
  isSameOrigin,
  noStore,
  trustedClientIp,
} from '@/lib/customer-auth';
import { verifyTelegramLogin } from '@/lib/telegram-login';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (process.env.CUSTOMER_LOGIN_ENABLED !== 'true') {
    return noStore({ error: 'Accesso non disponibile.' }, 503);
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
      db, 'customer_telegram_auth_ip', ip, 10
    );

    if (allowed !== true) {
      return noStore({
        error: allowed === null
          ? 'Protezione non disponibile.'
          : 'Troppi tentativi.',
      }, allowed === null ? 503 : 429);
    }

    const raw = await request.text();

    if (raw.length > 4096) {
      return noStore({ error: 'Richiesta troppo grande.' }, 413);
    }

    const payload = JSON.parse(raw);
    const verified = verifyTelegramLogin(payload);

    if (!verified) {
      return noStore({ error: 'Verifica Telegram non valida.' }, 401);
    }

    const idAllowed = await customerLimit(
      db,
      'customer_telegram_auth_id',
      verified.telegramUserId,
      5
    );

    if (idAllowed !== true) {
      return noStore({
        error: idAllowed === null
          ? 'Protezione non disponibile.'
          : 'Troppi tentativi.',
      }, idAllowed === null ? 503 : 429);
    }

    const token = randomBytes(32).toString('hex');

    const { error } = await db
      .from('customer_telegram_verifications')
      .insert({
        telegram_user_id: verified.telegramUserId,
        telegram_username: verified.telegramUsername,
        telegram_auth_hash: digest(String(payload.hash).toLowerCase()),
        token_hash: digest(token),
        purpose: 'login',
        verified_at: verified.verifiedAt,
        expires_at: new Date(
          Date.now() + 5 * 60 * 1000
        ).toISOString(),
      });

    if (error) {
      console.error('Telegram auth:', error.code);
      return noStore({
        error: 'Impossibile completare la verifica.',
      }, 503);
    }

    return noStore({
      success: true,
      verificationToken: token,
    });

  } catch (error) {
    if (error instanceof SyntaxError) {
      return noStore({ error: 'JSON non valido.' }, 400);
    }

    console.error('Telegram auth:', error?.code || error?.message);
    return noStore({ error: 'Errore interno.' }, 500);
  }
}
