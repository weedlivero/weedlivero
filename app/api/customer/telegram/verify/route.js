
import { createHash, randomBytes } from 'node:crypto';
import {
  customerDb,
  customerLimit,
  isSameOrigin,
  noStore,
  trustedClientIp,
} from '@/lib/customer-auth';
import { verifyTelegramLogin } from '@/lib/telegram-login';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (process.env.CUSTOMER_REGISTRATION_ENABLED !== 'true') {
    return noStore({ error: 'Registrazione non ancora disponibile.' }, 503);
  }

  if (!isSameOrigin(request)) {
    return noStore({ error: 'Origine non autorizzata.' }, 403);
  }

  if (!(request.headers.get('content-type') || '')
    .toLowerCase().startsWith('application/json')) {
    return noStore({ error: 'Formato richiesta non valido.' }, 415);
  }

  try {
    const ip = trustedClientIp(request);

    if (!ip) {
      return noStore({ error: 'Impossibile verificare la richiesta.' }, 503);
    }

    const db = customerDb();

    const ipAllowed = await customerLimit(
      db, 'customer_telegram_verify_ip', ip, 10
    );

    if (ipAllowed === null) {
      return noStore({ error: 'Protezione temporaneamente non disponibile.' }, 503);
    }

    if (!ipAllowed) {
      return noStore({ error: 'Troppi tentativi. Riprova più tardi.' }, 429);
    }

    const raw = await request.text();

    if (raw.length > 4096) {
      return noStore({ error: 'Richiesta troppo grande.' }, 413);
    }

    const payload = JSON.parse(raw);
    const verified = verifyTelegramLogin(payload);

    if (!verified) {
      return noStore({ error: 'Verifica Telegram non valida o scaduta.' }, 401);
    }

    const telegramIdAllowed = await customerLimit(
      db,
      'customer_telegram_verify_id',
      verified.telegramUserId,
      5
    );

    if (telegramIdAllowed === null) {
      return noStore({ error: 'Protezione temporaneamente non disponibile.' }, 503);
    }

    if (!telegramIdAllowed) {
      return noStore({ error: 'Troppi tentativi. Riprova più tardi.' }, 429);
    }

    const { data: existing, error: lookupError } = await db
      .from('customer_accounts')
      .select('id')
      .eq('telegram_user_id', verified.telegramUserId)
      .limit(1);

    if (lookupError) {
      console.error('Controllo account Telegram:', lookupError.code);
      return noStore({ error: 'Verifica non disponibile.' }, 503);
    }

    if (existing?.length) {
      return noStore({ error: 'Questo account Telegram è già registrato.' }, 409);
    }

    const authHash = createHash('sha256')
      .update(String(payload.hash).toLowerCase())
      .digest('hex');

    const token = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      .toISOString();

    const { error: insertError } = await db
      .from('customer_telegram_verifications')
      .insert({
        telegram_user_id: verified.telegramUserId,
        telegram_username: verified.telegramUsername,
        telegram_auth_hash: authHash,
        token_hash: tokenHash,
        purpose: 'registration',
        verified_at: verified.verifiedAt,
        expires_at: expiresAt,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return noStore({
          error: 'Questa verifica Telegram è già stata utilizzata. Effettua una nuova autenticazione.',
        }, 409);
      }

      console.error('Creazione verifica Telegram:', insertError.code);
      return noStore({
        error: 'Impossibile completare la verifica.',
      }, 500);
    }

    return noStore({
      success: true,
      telegramUsername: verified.telegramUsername,
      verificationToken: token,
      expiresAt,
    });

  } catch (error) {
    if (error instanceof SyntaxError) {
      return noStore({ error: 'JSON non valido.' }, 400);
    }

    console.error('Errore verifica Telegram:', error?.code || error?.message);
    return noStore({ error: 'Errore interno.' }, 500);
  }
}
